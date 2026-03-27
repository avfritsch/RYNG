const STORAGE_KEY = 'ryng_speech_enabled';

let voices: SpeechSynthesisVoice[] = [];

function loadVoices() {
  voices = speechSynthesis.getVoices();
}

if (typeof speechSynthesis !== 'undefined') {
  loadVoices();
  speechSynthesis.onvoiceschanged = loadVoices;
}

function getGermanVoice(): SpeechSynthesisVoice | undefined {
  return voices.find((v) => v.lang.startsWith('de')) ?? voices[0];
}

export function isSpeechAvailable(): boolean {
  return typeof speechSynthesis !== 'undefined';
}

export function isSpeechEnabled(): boolean {
  if (!isSpeechAvailable()) return false;
  return localStorage.getItem(STORAGE_KEY) !== 'false';
}

export function setSpeechEnabled(enabled: boolean) {
  localStorage.setItem(STORAGE_KEY, String(enabled));
}

export function speak(text: string) {
  if (!isSpeechEnabled()) return;

  // Cancel any ongoing speech
  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'de-DE';
  utterance.rate = 1.1;
  utterance.pitch = 1.0;
  utterance.volume = 0.9;

  const voice = getGermanVoice();
  if (voice) utterance.voice = voice;

  speechSynthesis.speak(utterance);
}

export function speakStation(name: string, seconds: number) {
  speak(`${name} — ${seconds} Sekunden`);
}

export function speakPause(seconds: number) {
  speak(`Pause — ${seconds} Sekunden`);
}

export function speakRoundPause(round: number, totalRounds: number, seconds: number) {
  speak(`Rundenpause. Runde ${round} von ${totalRounds} abgeschlossen. ${seconds} Sekunden.`);
}

export function speakDone() {
  speak('Fertig! Gutes Training!');
}
