const HR_SERVICE = 'heart_rate';
const HR_MEASUREMENT = 'heart_rate_measurement';

type HRCallback = (bpm: number) => void;

let device: BluetoothDevice | null = null;
let characteristic: BluetoothRemoteGATTCharacteristic | null = null;
let listeners: HRCallback[] = [];
let lastBpm = 0;

export function isBluetoothAvailable(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

export function isConnected(): boolean {
  return device?.gatt?.connected ?? false;
}

export function getLastBpm(): number {
  return lastBpm;
}

export function onHeartRate(fn: HRCallback): () => void {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

function notify(bpm: number) {
  lastBpm = bpm;
  listeners.forEach((fn) => fn(bpm));
}

function parseHeartRate(value: DataView): number {
  const flags = value.getUint8(0);
  // Bit 0: 0 = uint8, 1 = uint16
  if (flags & 0x01) {
    return value.getUint16(1, true);
  }
  return value.getUint8(1);
}

function handleMeasurement(event: Event) {
  const target = event.target as BluetoothRemoteGATTCharacteristic;
  if (target.value) {
    const bpm = parseHeartRate(target.value);
    if (bpm > 0 && bpm < 250) {
      notify(bpm);
    }
  }
}

export async function connect(): Promise<string> {
  if (!isBluetoothAvailable()) {
    throw new Error('Bluetooth nicht verfügbar');
  }

  device = await navigator.bluetooth.requestDevice({
    filters: [{ services: [HR_SERVICE] }],
    optionalServices: [HR_SERVICE],
  });

  if (!device.gatt) throw new Error('GATT nicht verfügbar');

  const server = await device.gatt.connect();
  const service = await server.getPrimaryService(HR_SERVICE);
  characteristic = await service.getCharacteristic(HR_MEASUREMENT);

  characteristic.addEventListener('characteristicvaluechanged', handleMeasurement);
  await characteristic.startNotifications();

  device.addEventListener('gattserverdisconnected', () => {
    notify(0);
  });

  return device.name ?? 'HR Sensor';
}

export async function disconnect() {
  try {
    if (characteristic) {
      characteristic.removeEventListener('characteristicvaluechanged', handleMeasurement);
      await characteristic.stopNotifications().catch(() => {});
      characteristic = null;
    }
    if (device?.gatt?.connected) {
      device.gatt.disconnect();
    }
    device = null;
    lastBpm = 0;
    notify(0);
  } catch {
    // Ignore cleanup errors
  }
}
