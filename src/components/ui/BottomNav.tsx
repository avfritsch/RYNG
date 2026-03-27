import { NavLink } from 'react-router-dom';
import { Icon } from './Icon.tsx';
import '../../styles/bottom-nav.css';

const tabs = [
  { to: '/', label: 'Timer', icon: 'timer' },
  { to: '/plans', label: 'Pläne', icon: 'clipboard-list' },
  { to: '/library', label: 'Bibliothek', icon: 'dumbbell' },
  { to: '/history', label: 'Verlauf', icon: 'bar-chart' },
  { to: '/profile', label: 'Profil', icon: 'user' },
] as const;

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Hauptnavigation">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            `bottom-nav-item ${isActive ? 'active' : ''}`
          }
          end={tab.to === '/'}
        >
          <Icon name={tab.icon} size={20} />
          <span className="bottom-nav-label">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
