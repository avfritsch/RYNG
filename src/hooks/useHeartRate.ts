import { useState, useEffect } from 'react';
import { connect, disconnect, onHeartRate, isConnected, isBluetoothAvailable } from '../lib/heartrate.ts';
import { toast } from '../stores/toast-store.ts';

export function useHeartRate() {
  const [bpm, setBpm] = useState(0);
  const [connected, setConnected] = useState(false);
  const [deviceName, setDeviceName] = useState('');

  useEffect(() => {
    const unsubscribe = onHeartRate((newBpm) => {
      setBpm(newBpm);
      if (newBpm === 0 && connected) {
        setConnected(false);
        setDeviceName('');
        toast.info('HR-Sensor getrennt');
      }
    });
    return unsubscribe;
  }, [connected]);

  async function connectHR() {
    try {
      const name = await connect();
      setConnected(true);
      setDeviceName(name);
      toast.success(`Verbunden: ${name}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Verbindung fehlgeschlagen';
      if (!msg.includes('cancelled')) {
        toast.error(msg);
      }
    }
  }

  async function disconnectHR() {
    await disconnect();
    setConnected(false);
    setDeviceName('');
    setBpm(0);
  }

  return {
    bpm,
    connected,
    deviceName,
    available: isBluetoothAvailable(),
    isConnected: () => isConnected(),
    connect: connectHR,
    disconnect: disconnectHR,
  };
}
