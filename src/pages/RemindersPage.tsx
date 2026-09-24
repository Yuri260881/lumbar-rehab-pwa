import { useState } from 'react';
import { useApp } from '../hooks/useAppData';
import { Card, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge, TimeField, Toggle } from '../components/ui/Controls';
import { IconAlert, IconBell } from '../components/ui/Icon';
import { describePlatformLimits } from '../lib/notifications';
import { formatDateTime, formatShortDate, relativeDaysLabel, toDateKey } from '../lib/dates';

export function RemindersPage() {
  const {
    data,
    update,
    capabilities,
    askNotificationPermission,
    dueReminders,
    markReminderDone,
    snoozeReminder,
    serviceWorkerReady,
  } = useApp();
  const [permissionNote, setPermissionNote] = useState<string | null>(null);
  const reminders = data.preferences.reminders;

  const patch = async (
    kind: 'workout' | 'inversion',
    patchValue: Partial<{ enabled: boolean; time: string; everyNDays: number }>,
  ) => {
    await update((current) => ({
      ...current,
      preferences: {
        ...current.preferences,
        reminders: {
          ...current.preferences.reminders,
          [kind]: { ...current.preferences.reminders[kind], ...patchValue },
        },
      },
    }));
  };

  const workoutNext = new Date();
  workoutNext.setHours(
    Number.parseInt(reminders.workout.time.split(':')[0] ?? '8', 10),
    Number.parseInt(reminders.workout.time.split(':')[1] ?? '0', 10),
    0,
    0,
  );
  if (workoutNext.getTime() < Date.now()) workoutNext.setDate(workoutNext.getDate() + 1);

  const permissionOk = capabilities.permission === 'granted';

  return (
    <div className="mx-auto max-w-content space-y-4">
      <Card className="card-pad">
        <CardTitle icon={<IconBell className="h-6 w-6" />}>Ежедневное утреннее напоминание</CardTitle>
        <div className="mt-3">
          <Toggle
            label="Включено"
            description="Каждый день напоминает о тренировке в выбранное время."
            checked={reminders.workout.enabled}
            onChange={(next) => void patch('workout', { enabled: next })}
          />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <TimeField
            label="Время"
            value={reminders.workout.time}
            disabled={!reminders.workout.enabled}
            onChange={(next) => void patch('workout', { time: next })}
          />
          <div className="rounded-xl border border-ink-700 bg-ink-900/50 p-3">
            <p className="label">Ближайшее напоминание</p>
            <p className="mt-1 text-lg font-semibold text-ink-50">
              {formatDateTime(workoutNext.toISOString())}
            </p>
            <p className="hint">{relativeDaysLabel(toDateKey(workoutNext))}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() =>
              void update((current) => ({
                ...current,
                preferences: {
                  ...current.preferences,
                  reminders: {
                    ...current.preferences.reminders,
                    workout: {
                      ...current.preferences.reminders.workout,
                      snoozedUntil: new Date(Date.now() + 60 * 60_000).toISOString(),
                    },
                  },
                },
              }))
            }
          >
            Отложить на 1 час
          </Button>
          <Button variant="ghost" onClick={() => void markReminderDone(`workout-${toDateKey(new Date())}`)}>
            Отметить выполненным сегодня
          </Button>
        </div>
      </Card>

      <Card className="card-pad">
        <CardTitle>Напоминание об инверсионном столе</CardTitle>
        <div className="mt-3">
          <Toggle
            label="Включено"
            description="Напоминает через день. Работает только если вы подтвердили разрешение врача."
            checked={reminders.inversion.enabled}
            onChange={(next) => void patch('inversion', { enabled: next })}
            disabled={!data.preferences.inversionDoctorApproved}
          />
        </div>
        {!data.preferences.inversionDoctorApproved ? (
          <p className="hint mt-2">
            Сначала подтвердите в разделе «Инверсионный стол», что врач разрешил его использовать.
          </p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <TimeField
              label="Время"
              value={reminders.inversion.time}
              disabled={!reminders.inversion.enabled}
              onChange={(next) => void patch('inversion', { time: next })}
            />
            <div className="rounded-xl border border-ink-700 bg-ink-900/50 p-3">
              <p className="label">Интервал</p>
              <p className="mt-1 text-lg font-semibold text-ink-50">
                каждый {reminders.inversion.everyNDays}-й день
              </p>
              <div className="mt-2 flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => void patch('inversion', { everyNDays: Math.max(1, reminders.inversion.everyNDays - 1) })}
                >
                  чаще
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => void patch('inversion', { everyNDays: Math.min(14, reminders.inversion.everyNDays + 1) })}
                >
                  реже
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card className="card-pad">
        <CardTitle>Напоминания на сегодня</CardTitle>
        {dueReminders.length === 0 ? (
          <p className="hint mt-2">На сегодня активных напоминаний нет.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {dueReminders.map((reminder) => (
              <li key={reminder.id} className="rounded-xl border border-ink-700 bg-ink-900/50 p-3">
                <p className="font-medium text-ink-50">{reminder.title}</p>
                <p className="hint mt-1">{reminder.body}</p>
                <p className="hint mt-1">в {new Date(reminder.dueAt).toTimeString().slice(0, 5)}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button variant="ghost" onClick={() => void snoozeReminder(reminder.id, 30)}>
                    Отложить 30 мин
                  </Button>
                  <Button variant="ghost" onClick={() => void markReminderDone(reminder.id)}>
                    Выполнено
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="card-pad">
        <CardTitle>Уведомления браузера</CardTitle>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge tone={capabilities.apiSupported ? 'teal' : 'warn'}>
            API: {capabilities.apiSupported ? 'доступен' : 'недоступен'}
          </Badge>
          <Badge tone={permissionOk ? 'teal' : 'warn'}>
            разрешение: {capabilities.permission}
          </Badge>
          <Badge tone={capabilities.secureContext ? 'teal' : 'warn'}>
            HTTPS/localhost: {capabilities.secureContext ? 'да' : 'нет'}
          </Badge>
          <Badge tone={serviceWorkerReady ? 'teal' : 'warn'}>
            service worker: {serviceWorkerReady ? 'активен' : 'не активен'}
          </Badge>
          <Badge tone={capabilities.installedStandalone ? 'teal' : 'warn'}>
            установлено как PWA: {capabilities.installedStandalone ? 'да' : 'нет'}
          </Badge>
        </div>

        {!permissionOk ? (
          <Button
            className="mt-4"
            variant="primary"
            disabled={!capabilities.apiSupported}
            onClick={async () => {
              const result = await askNotificationPermission();
              setPermissionNote(
                result.permission === 'granted'
                  ? 'Разрешение выдано. Если уведомление не придёт при закрытом приложении — это ограничение браузера, напоминание останется внутри приложения.'
                  : result.permission === 'denied'
                    ? 'Разрешение отклонено. Напоминания будут показываться внутри приложения.'
                    : 'Уведомления в этом браузере недоступны. Напоминания будут показываться внутри приложения.',
              );
            }}
          >
            Запросить разрешение на уведомления
          </Button>
        ) : null}
        {permissionNote ? <p className="hint mt-3">{permissionNote}</p> : null}

        <div className="mt-4 rounded-xl border border-ink-700 bg-ink-900/50 p-3">
          <p className="text-sm font-semibold text-ink-50">Ограничения PWA-уведомлений</p>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-ink-200">
            {describePlatformLimits().map((limit) => (
              <li key={limit}>{limit}</li>
            ))}
            <li>
              Приложение намеренно не использует фоновые механизмы, которые браузер не может
              гарантировать. Резервный список напоминаний всегда доступен на этой странице и на
              главной.
            </li>
          </ul>
        </div>
      </Card>

      <Card className="card-pad">
        <CardTitle>История тренировок</CardTitle>
        {data.sessions.length === 0 ? (
          <p className="hint mt-2">Пока нет завершённых занятий.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {data.sessions.slice(0, 12).map((session) => (
              <li
                key={session.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ink-700 bg-ink-900/50 p-3"
              >
                <span className="text-base text-ink-50">{formatShortDate(session.date)}</span>
                <span className="hint">
                  {session.completedExerciseIds.length} из {session.exerciseIds.length} упражнений ·{' '}
                  {Math.round(session.durationSeconds / 60)} мин
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card tone="warn" className="card-pad">
        <div className="flex items-start gap-3">
          <IconAlert className="mt-0.5 h-5 w-5 shrink-0 text-warn-300" />
          <p className="text-sm leading-relaxed text-warn-100">
            Напоминание не заменяет консультацию специалиста. Если боль усиливается или появляются
            новые симптомы, пропустите занятие и обратитесь к врачу.
          </p>
        </div>
      </Card>
    </div>
  );
}
