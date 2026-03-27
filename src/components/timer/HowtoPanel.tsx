import '../../styles/howto-panel.css';

interface HowtoPanelProps {
  text: string;
}

export function HowtoPanel({ text }: HowtoPanelProps) {
  if (!text) return null;

  return (
    <div className="howto-panel">
      {text}
    </div>
  );
}
