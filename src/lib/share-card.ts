export interface ShareCardData {
  title: string;
  duration: string;
  exercises: number;
  rounds: number;
  streak?: number;
  date: string;
}

export async function generateShareCard(data: ShareCardData): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d')!;

  // Background: dark gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, 1080);
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(1, '#16213e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1080);

  // Accent line at top
  ctx.fillStyle = '#4ade80';
  ctx.fillRect(0, 0, 1080, 6);

  // App branding
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('RYNG', 80, 100);

  // Date
  ctx.fillStyle = '#94a3b8';
  ctx.font = '28px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(data.date, 1000, 100);

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 56px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(data.title, 540, 300);

  // Duration (big)
  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 160px system-ui, sans-serif';
  ctx.fillText(data.duration, 540, 520);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '32px system-ui, sans-serif';
  ctx.fillText('Minuten', 540, 570);

  // Stats row
  const statsY = 700;
  const stats: { value: string; label: string }[] = [
    { value: String(data.exercises), label: 'Übungen' },
    { value: String(data.rounds), label: 'Runden' },
  ];
  if (data.streak && data.streak > 1) {
    stats.push({ value: `🔥 ${data.streak}`, label: 'Streak' });
  }

  const statWidth = 1080 / stats.length;
  stats.forEach((stat, i) => {
    const x = statWidth * i + statWidth / 2;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(stat.value, x, statsY);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '28px system-ui, sans-serif';
    ctx.fillText(stat.label, x, statsY + 45);
  });

  // Footer
  ctx.fillStyle = '#475569';
  ctx.font = '24px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ryng.app', 540, 1000);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png', 0.95);
  });
}

export async function shareWorkoutCard(data: ShareCardData): Promise<void> {
  const blob = await generateShareCard(data);
  const file = new File([blob], 'ryng-workout.png', { type: 'image/png' });

  // Try Web Share API first (mobile)
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: 'RYNG Workout',
      text: `${data.duration} Min · ${data.exercises} Übungen · ${data.rounds} Runden`,
    });
    return;
  }

  // Fallback: download the image
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ryng-workout.png';
  a.click();
  URL.revokeObjectURL(url);
}
