import { useInstallStore } from '../../stores/install-store.ts';
import '../../styles/install-banner.css';

const MIN_VISITS = 3;

export function InstallBanner() {
  const canInstall = useInstallStore((s) => s.canInstall);
  const dismissed = useInstallStore((s) => s.dismissed);
  const install = useInstallStore((s) => s.install);
  const dismiss = useInstallStore((s) => s.dismiss);

  const visits = Number(localStorage.getItem('ryng_visits') || '0');

  if (!canInstall || dismissed || visits < MIN_VISITS) return null;

  return (
    <div className="install-banner" role="banner">
      <span className="install-banner__text">RYNG als App installieren</span>
      <button className="install-banner__install" onClick={install}>
        Installieren
      </button>
      <button className="install-banner__dismiss" onClick={dismiss} aria-label="Schließen">
        ×
      </button>
    </div>
  );
}
