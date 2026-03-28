const STORAGE_KEY = 'ryng_speech_enabled';

let voices: SpeechSynthesisVoice[] = [];

function loadVoices() {
  voices = speechSynthesis.getVoices();
}

if (typeof speechSynthesis !== 'undefined') {
  loadVoices();
  speechSynthesis.onvoiceschanged = loadVoices;
}

/**
 * Pick the best German voice available.
 * Priority: Premium > Enhanced > any German > first available.
 * iOS labels high-quality voices with "Premium" or "Enhanced" in the name.
 * Android/Chrome often has "Google Deutsch" which is decent.
 */
function getGermanVoice(): SpeechSynthesisVoice | undefined {
  const german = voices.filter((v) => v.lang.startsWith('de'));
  if (german.length === 0) return voices[0];

  // Prefer Premium (best on iOS 17+)
  const premium = german.find((v) => /premium/i.test(v.name));
  if (premium) return premium;

  // Then Enhanced (good on iOS 16+)
  const enhanced = german.find((v) => /enhanced/i.test(v.name));
  if (enhanced) return enhanced;

  // Then Google voices (decent on Android/Chrome)
  const google = german.find((v) => /google/i.test(v.name));
  if (google) return google;

  // Prefer non-compact voices (compact = low quality on macOS)
  const nonCompact = german.find((v) => !/compact/i.test(v.name));
  if (nonCompact) return nonCompact;

  return german[0];
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

export function speak(text: string, options?: { rate?: number; pitch?: number }) {
  if (!isSpeechEnabled()) return;

  // Cancel any ongoing speech
  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'de-DE';
  utterance.rate = options?.rate ?? 1.05;
  utterance.pitch = options?.pitch ?? 1.0;
  utterance.volume = 1.0;

  const voice = getGermanVoice();
  if (voice) utterance.voice = voice;

  speechSynthesis.speak(utterance);
}

// Short, punchy announcements — less text = less robotic
export function speakStation(name: string, _seconds: number) {
  speak(name);
}

export function speakPause(seconds: number) {
  speak(`Pause, ${seconds} Sekunden`, { rate: 0.95 });
}

export function speakRoundPause(round: number, totalRounds: number, _seconds: number) {
  speak(`Runde ${round} von ${totalRounds} geschafft`, { rate: 0.95 });
}

export function speakDone() {
  speak('Fertig!', { rate: 0.9, pitch: 1.1 });
}
