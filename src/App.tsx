import { useEffect, useState } from 'react';
import { useApp } from './hooks/useAppData';
import { BottomNav } from './components/layout/BottomNav';
import { AppHeader } from './components/layout/AppHeader';
import { RedFlagBanner } from './components/RedFlagBanner';
import { DisclaimerGate } from './components/DisclaimerGate';
import { DashboardPage } from './pages/DashboardPage';
import { LibraryPage } from './pages/LibraryPage';
import { ExerciseDetailPage } from './pages/ExerciseDetailPage';
import { WorkoutPage } from './pages/WorkoutPage';
import { TimerPage } from './pages/TimerPage';
import { RemindersPage } from './pages/RemindersPage';
import { InversionPage } from './pages/InversionPage';
import { GuidePage } from './pages/GuidePage';
import { DiaryPage } from './pages/DiaryPage';
import { SettingsPage } from './pages/SettingsPage';

export type Route =
  | { name: 'dashboard' }
  | { name: 'library' }
  | { name: 'exercise'; id: string }
  | { name: 'workout' }
  | { name: 'timer' }
  | { name: 'reminders' }
  | { name: 'inversion' }
  | { name: 'guide' }
  | { name: 'diary' }
  | { name: 'settings' };

export default function App() {
  const { data, status, registerServiceWorker } = useApp();
  const [route, setRoute] = useState<Route>({ name: 'dashboard' });

  // Register the service worker once the app is interactive so the first paint
  // is never blocked by it.
  useEffect(() => {
    const id = window.setTimeout(() => {
      void registerServiceWorker();
    }, 400);
    return () => window.clearTimeout(id);
  }, [registerServiceWorker]);

  // Scroll to the top on navigation (mobile-first single column layout).
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [route]);

  const reducedMotion = data.preferences.reducedMotion;

  return (
    <div className={`mx-auto flex min-h-full w-full max-w-app flex-col ${reducedMotion ? 'reduced-motion' : ''}`}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-gold-400 focus:px-4 focus:py-2 focus:text-ink-950"
      >
        Перейти к содержимому
      </a>

      <AppHeader route={route} onNavigate={setRoute} />

      <main id="main" className="flex-1 px-4 pb-28 pt-4 sm:px-6">
        {status === 'loading' ? (
          <p className="hint py-12 text-center" role="status">
            Загружаем локальные данные…
          </p>
        ) : (
          <>
            {status === 'unavailable' ? (
              <p className="hint mb-4 rounded-xl border border-warn-600/60 bg-warn-600/10 p-3">
                Локальное хранилище недоступно (например, в приватном режиме). Приложение работает,
                но записи не сохранятся после закрытия вкладки.
              </p>
            ) : null}

            <RedFlagBanner />

            {data.preferences.disclaimerAccepted ? (
              <RouteView route={route} onNavigate={setRoute} />
            ) : (
              <DisclaimerGate />
            )}
          </>
        )}
      </main>

      <BottomNav route={route} onNavigate={setRoute} />
    </div>
  );
}

function RouteView({ route, onNavigate }: { route: Route; onNavigate: (route: Route) => void }) {
  switch (route.name) {
    case 'dashboard':
      return <DashboardPage onNavigate={onNavigate} />;
    case 'library':
      return <LibraryPage onNavigate={onNavigate} />;
    case 'exercise':
      return <ExerciseDetailPage id={route.id} onNavigate={onNavigate} />;
    case 'workout':
      return <WorkoutPage onNavigate={onNavigate} />;
    case 'timer':
      return <TimerPage />;
    case 'reminders':
      return <RemindersPage />;
    case 'inversion':
      return <InversionPage />;
    case 'guide':
      return <GuidePage />;
    case 'diary':
      return <DiaryPage />;
    case 'settings':
      return <SettingsPage onNavigate={onNavigate} />;
    default:
      return null;
  }
}
