import type { Route } from '../../App';
import { IconBack } from '../ui/Icon';
import { useApp } from '../../hooks/useAppData';

const TITLES: Record<Route['name'], string> = {
  dashboard: 'Главная',
  library: 'Упражнения',
  exercise: 'Упражнение',
  workout: 'Тренировка',
  timer: 'Секундомер',
  reminders: 'Напоминания',
  inversion: 'Инверсионный стол',
  guide: 'Рекомендации',
  diary: 'Дневник',
  settings: 'Настройки',
};

export function AppHeader({
  route,
  onNavigate,
}: {
  route: Route;
  onNavigate: (route: Route) => void;
}) {
  const { data } = useApp();
  const isDetail = route.name === 'exercise';
  const name = data.preferences.displayName.trim();

  return (
    <header className="sticky top-0 z-30 border-b border-ink-700/60 bg-ink-950/85 backdrop-blur">
      <div className="mx-auto flex min-h-[60px] w-full max-w-app items-center gap-3 px-4 py-2 sm:px-6">
        {isDetail ? (
          <button
            type="button"
            className="btn-ghost -ml-2 px-2"
            aria-label="Назад к списку упражнений"
            onClick={() => onNavigate({ name: 'library' })}
          >
            <IconBack />
          </button>
        ) : (
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gold-600/60 bg-gold-600/15 text-gold-300"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
              <path d="M12 3.5c2.4 2 2.4 4.6 0 6.6-2.4 2-2.4 4.6 0 6.6" />
              <path d="M6 6.5h12M6 17.5h12" />
            </svg>
          </span>
        )}

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold tracking-tight text-ink-50">
            {TITLES[route.name]}
          </h1>
          <p className="truncate text-xs text-ink-300">
            {name ? `Lumbar Rehab · ${name}` : 'Lumbar Rehab Dashboard'}
          </p>
        </div>

        <span className="chip border-ink-600 text-ink-300">
          <span aria-hidden="true">●</span>
          офлайн
        </span>
      </div>
    </header>
  );
}
