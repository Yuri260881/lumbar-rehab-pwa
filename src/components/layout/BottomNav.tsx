import type { ComponentType, SVGProps } from 'react';
import type { Route } from '../../App';
import { IconDashboard, IconDiary, IconLibrary, IconSettings, IconTimer } from '../ui/Icon';

const ITEMS: Array<{
  route: Route;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;
  match: Route['name'][];
}> = [
  {
    route: { name: 'dashboard' },
    label: 'Главная',
    icon: IconDashboard,
    match: ['dashboard'],
  },
  {
    route: { name: 'library' },
    label: 'Упражнения',
    icon: IconLibrary,
    match: ['library', 'exercise'],
  },
  {
    route: { name: 'timer' },
    label: 'Таймер',
    icon: IconTimer,
    match: ['timer', 'workout'],
  },
  {
    route: { name: 'diary' },
    label: 'Дневник',
    icon: IconDiary,
    match: ['diary'],
  },
  {
    route: { name: 'settings' },
    label: 'Ещё',
    icon: IconSettings,
    match: ['settings', 'reminders', 'inversion', 'guide'],
  },
];

export function BottomNav({
  route,
  onNavigate,
}: {
  route: Route;
  onNavigate: (route: Route) => void;
}) {
  return (
    <nav
      aria-label="Основная навигация"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-700/70 bg-ink-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto flex w-full max-w-app items-stretch justify-between gap-1 px-2 py-1.5">
        {ITEMS.map((item) => {
          const active = item.match.includes(route.name);
          const Icon = item.icon;
          return (
            <li key={item.label} className="flex-1">
              <button
                type="button"
                onClick={() => onNavigate(item.route)}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-[56px] w-full flex-col items-center justify-center gap-1 rounded-xl px-1 text-xs transition-colors
                  ${active ? 'bg-ink-800 text-gold-300' : 'text-ink-300 hover:text-ink-100'}`}
              >
                <Icon className="h-6 w-6" />
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
