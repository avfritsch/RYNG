import { useState } from 'react';
import '../../styles/exercise-illustration.css';

const STORAGE_BASE = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/exercise-images`
  : '';

type IllustrationSize = 'thumb' | 'preview' | 'full';

interface ExerciseIllustrationProps {
  illustrationKey: string | null | undefined;
  size?: IllustrationSize;
  className?: string;
}

export function ExerciseIllustration({ illustrationKey, size = 'preview', className = '' }: ExerciseIllustrationProps) {
  const [failed, setFailed] = useState(false);

  if (!illustrationKey || !STORAGE_BASE || failed) return null;

  const url = `${STORAGE_BASE}/${illustrationKey}/${size}.webp`;

  return (
    <img
      className={`exercise-illustration exercise-illustration--${size} ${className}`}
      src={url}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
