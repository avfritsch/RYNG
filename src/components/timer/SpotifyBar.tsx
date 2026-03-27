import { useState, useEffect, useRef } from 'react';
import {
  isSpotifyConnected,
  spotifyGetState,
  spotifyPlay,
  spotifyPause,
  spotifyNext,
  spotifyPrevious,
  spotifySetVolume,
  type SpotifyPlaybackState,
} from '../../lib/spotify.ts';
import { Icon } from '../ui/Icon.tsx';
import '../../styles/spotify-bar.css';

interface SpotifyBarProps {
  /** Current timer phase — used for auto-volume */
  phase: string;
}

export function SpotifyBar({ phase }: SpotifyBarProps) {
  const [state, setState] = useState<SpotifyPlaybackState | null>(null);
  const prevPhaseRef = useRef(phase);

  // Poll playback state every 5s
  useEffect(() => {
    if (!isSpotifyConnected()) return;

    let active = true;
    async function poll() {
      const s = await spotifyGetState();
      if (active) setState(s);
    }

    poll();
    const interval = setInterval(poll, 5000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  // Auto-volume: louder on work, quieter on pause
  useEffect(() => {
    if (!isSpotifyConnected() || phase === prevPhaseRef.current) return;
    prevPhaseRef.current = phase;

    if (phase === 'work' || phase === 'warmup') {
      spotifySetVolume(80);
    } else if (phase === 'pause') {
      spotifySetVolume(40);
    } else if (phase === 'roundPause') {
      spotifySetVolume(30);
    }
  }, [phase]);

  if (!isSpotifyConnected() || !state?.item) return null;

  const track = state.item;
  const artist = track.artists.map((a) => a.name).join(', ');
  const albumArt = track.album.images[track.album.images.length - 1]?.url;

  async function togglePlay() {
    if (state?.is_playing) {
      await spotifyPause();
      setState((s) => s ? { ...s, is_playing: false } : s);
    } else {
      await spotifyPlay();
      setState((s) => s ? { ...s, is_playing: true } : s);
    }
  }

  return (
    <div className="spotify-bar">
      {albumArt && <img className="spotify-art" src={albumArt} alt="" />}
      <div className="spotify-info">
        <span className="spotify-track">{track.name}</span>
        <span className="spotify-artist">{artist}</span>
      </div>
      <div className="spotify-controls">
        <button className="spotify-btn" onClick={spotifyPrevious} aria-label="Vorheriger Titel">
          <Icon name="skip-back" size={14} />
        </button>
        <button className="spotify-btn spotify-btn--play" onClick={togglePlay} aria-label={state.is_playing ? 'Pause' : 'Abspielen'}>
          <Icon name={state.is_playing ? 'pause' : 'play'} size={16} />
        </button>
        <button className="spotify-btn" onClick={spotifyNext} aria-label="Nächster Titel">
          <Icon name="skip-forward" size={14} />
        </button>
      </div>
    </div>
  );
}
