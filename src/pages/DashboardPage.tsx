import { useMemo } from 'react';
import type { Route } from '../App';
import { useApp, useTodayEntry } from '../hooks/useAppData';
import { Card, CardTitle, Metric } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge, Progress } from '../components/ui/Controls';
import {
  IconAlert,
  IconBell,
  IconInversion,
  IconPlay,
  IconShield,
  IconWalk,
} from '../components/ui/Icon';
import { EXERCISES_BY_ID } from '../data/exercises';
import { tipForDate } from '../data/content';
import {
  formatClock,
  formatShortDate,
  greetingForHour,
  nextOccurrence,
  relativeDaysLabel,
  toDateKey,
} from '../lib/dates';
import { inversionDayStatus } from '../lib/notifications';
import { hasRedFlags } from '../types';

export function DashboardPage({ onNavigate }: { onNavigate: (route: Route) => void }) {
  const { data, dueReminders, inAppAlerts, markReminderDone } = useApp();
  const todayEntry = useTodayEntry();
  const now = new Date();
  const todayKey = toDateKey(now);
  const blocked = hasRedFlags(data.redFlags);

  const program = useMemo(
    () =>
      data.preferences.program.exerciseIds
        .map((id) => EXERCISES_BY_ID[id])
        .filter((exercise): exercise is NonNullable<typeof exercise> => Boolean(exercise)),
    [data.preferences.program.exerciseIds],
  );

  const todaySession = data.sessions.find((session) => session.date === todayKey);
  const completedCount = todaySession?.completedExerciseIds.length ?? 0;

  const nextWorkout = nextOccurrence(data.preferences.reminders.workout.time, now);
  const nextInversion = data.preferences.inversionAnchorDate
    ? inversionDayStatus(
        data.preferences.inversionAnchorDate,
        data.preferences.reminders.inversion.everyNDays,
        todayKey,
      )
    : null;

  const pain = todayEntry?.pain ?? null;
  const totalSessions = data.sessions.length;
  const last7 = data.sessions.filter(
    (session) => session.date >= toDateKey(new Date(now.getTime() - 6 * 86_400_000)),
  ).length;

  return (
    <div className="mx-auto max-w-content space-y-4">
      {/* Greeting */}
      <section className="pt-1">
        <h2 className="text-2xl font-semibold tracking-tight text-ink-50">
          {greetingForHour(now.getHours())}
          {data.preferences.displayName.trim() ? `, ${data.preferences.displayName.trim()}` : ''}
        </h2>
        <p className="hint mt-1">
          {formatShortDate(todayKey)} · поддержание реабилитации по согласованию с врачом
        </p>
      </section>

      {/* Pending reminders — always visible, even without notification permission */}
      {dueReminders.length > 0 || inAppAlerts.length > 0 ? (
        <Card tone="accent" className="card-pad">
          <CardTitle icon={<IconBell className="h-6 w-6" />}>Напоминания на сегодня</CardTitle>
          <ul className="mt-3 space-y-3">
            {[...inAppAlerts, ...dueReminders]
              .filter((reminder, index, all) => all.findIndex((item) => item.id === reminder.id) === index)
              .map((reminder) => (
                <li key={reminder.id} className="rounded-xl border border-ink-700 bg-ink-900/60 p-3">
                  <p className="font-medium text-ink-50">{reminder.title}</p>
                  <p className="hint mt-1">{reminder.body}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="primary"
                      onClick={() =>
                        onNavigate(reminder.kind === 'workout' ? { name: 'workout' } : { name: 'inversion' })
                      }
                    >
                      Открыть
                    </Button>
                    <Button variant="ghost" onClick={() => void markReminderDone(reminder.id)}>
                      Отметить выполненным
                    </Button>
                  </div>
                </li>
              ))}
          </ul>
        </Card>
      ) : null}

      {/* Today's program */}
      <Card className="card-pad">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitle icon={<IconWalk className="h-6 w-6" />}>Сегодняшняя программа</CardTitle>
          <Badge tone="gold">{program.length} упражнений</Badge>
        </div>

        <div className="mt-3">
          <Progress
            value={completedCount}
            max={program.length}
            label={`Выполнено ${completedCount} из ${program.length}`}
          />
        </div>

        <ul className="mt-4 space-y-2">
          {program.slice(0, 4).map((exercise, index) => (
            <li key={exercise.id}>
              <button
                type="button"
                onClick={() => onNavigate({ name: 'exercise', id: exercise.id })}
                className="flex w-full items-center gap-3 rounded-xl border border-ink-700/70 bg-ink-900/50 p-3 text-left hover:border-ink-600"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ink-600 text-xs text-ink-300">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base text-ink-50">{exercise.name}</span>
                  <span className="hint block truncate">
                    {exercise.dosing.unit === 'seconds'
                      ? `${exercise.dosing.value} с · ${exercise.dosing.sets} подх.`
                      : `${exercise.dosing.value} повт. · ${exercise.dosing.sets} подх.`}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        {program.length > 4 ? (
          <p className="hint mt-2">и ещё {program.length - 4} — смотрите раздел «Упражнения»</p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {blocked ? (
            <Button variant="danger" size="lg" onClick={() => onNavigate({ name: 'guide' })}>
              Упражнения недоступны — тревожные симптомы
            </Button>
          ) : (
            <Button variant="primary" size="lg" onClick={() => onNavigate({ name: 'workout' })}>
              <IconPlay className="h-5 w-5" />
              Начать тренировку
            </Button>
          )}
          <Button variant="secondary" onClick={() => onNavigate({ name: 'library' })}>
            Библиотека
          </Button>
        </div>
      </Card>

      {/* Wellbeing + pain */}
      <Card className="card-pad">
        <CardTitle>Самочувствие</CardTitle>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Metric
            label="Боль сейчас"
            value={pain === null ? '—' : `${pain}/10`}
            caption={pain === null ? 'нет записи за сегодня' : 'по вашей оценке'}
            tone={pain === null ? 'default' : pain >= 7 ? 'danger' : pain >= 4 ? 'warn' : 'accent'}
          />
          <Metric
            label="Сон"
            value={todayEntry?.sleepQuality ? `${todayEntry.sleepQuality}/5` : '—'}
            caption="качество сна"
          />
          <Metric label="Тренировок за 7 дней" value={last7} caption={`всего ${totalSessions}`} />
          <Metric
            label="Онемение / слабость"
            value={
              todayEntry
                ? `${todayEntry.numbness ? 'да' : 'нет'} / ${todayEntry.weakness ? 'да' : 'нет'}`
                : '—'
            }
            caption="по дневнику"
            tone={todayEntry && (todayEntry.numbness || todayEntry.weakness) ? 'warn' : 'default'}
          />
        </div>
        <Button className="mt-4" variant="secondary" block onClick={() => onNavigate({ name: 'diary' })}>
          {todayEntry ? 'Обновить запись за сегодня' : 'Заполнить дневник'}
        </Button>
        <p className="hint mt-3">
          Приложение не ставит диагнозы и не подбирает лечение по одному симптому. Цифры дневника
          нужны вам и вашему специалисту для наблюдения за динамикой.
        </p>
      </Card>

      {/* Next reminder + inversion */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="card-pad">
          <CardTitle icon={<IconBell className="h-6 w-6" />}>Ближайшее напоминание</CardTitle>
          {data.preferences.reminders.workout.enabled ? (
            <>
              <p className="mt-2 text-xl font-semibold text-ink-50">
                {formatClock(
                  Math.max(0, Math.round((nextWorkout.getTime() - now.getTime()) / 1000)),
                )}
              </p>
              <p className="hint mt-1">
                тренировка · {relativeDaysLabel(toDateKey(nextWorkout), now)},{' '}
                {data.preferences.reminders.workout.time}
              </p>
            </>
          ) : (
            <p className="hint mt-2">Утреннее напоминание выключено.</p>
          )}
          <Button className="mt-4" variant="secondary" block onClick={() => onNavigate({ name: 'reminders' })}>
            Настроить
          </Button>
        </Card>

        <Card className="card-pad">
          <CardTitle icon={<IconInversion className="h-6 w-6" />}>Инверсионный стол</CardTitle>
          {data.preferences.inversionDoctorApproved && data.preferences.inversionAnchorDate ? (
            <p className="hint mt-2">
              {nextInversion === 'session'
                ? 'Сегодня день сеанса по вашей схеме через день.'
                : 'Сегодня день отдыха. Сеанс — через день.'}
            </p>
          ) : (
            <p className="hint mt-2">
              Отдельная опция. Доступна только после подтверждения, что врач разрешил её
              использовать.
            </p>
          )}
          <Button className="mt-4" variant="secondary" block onClick={() => onNavigate({ name: 'inversion' })}>
            Открыть раздел
          </Button>
        </Card>
      </div>

      {/* Tip of the day */}
      <Card tone="accent" className="card-pad">
        <CardTitle>Рекомендация дня</CardTitle>
        <p className="mt-2 text-base leading-relaxed text-ink-100">{tipForDate(todayKey)}</p>
        <Button className="mt-3" variant="ghost" onClick={() => onNavigate({ name: 'guide' })}>
          Все рекомендации с источниками
        </Button>
      </Card>

      {/* Warnings and limits */}
      <Card tone="warn" className="card-pad">
        <CardTitle icon={<IconShield className="h-6 w-6" />}>Предупреждения и ограничения</CardTitle>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-100">
          <li>
            Приложение поддерживает реабилитацию и помогает уменьшать симптомы по согласованию с
            врачом. Оно не обещает устранение грыжи и не заменяет консультацию специалиста.
          </li>
          <li>
            Прекращайте упражнение при усилении боли, распространении симптомов по ноге, нарастающем
            онемении или слабости.
          </li>
          <li>
            Не выполняйте упражнения в направлении, которое усиливает боль: направление подбирает
            специалист.
          </li>
        </ul>
        <button
          type="button"
          onClick={() => onNavigate({ name: 'guide' })}
          className="btn-ghost mt-3 -ml-3 px-3 text-gold-300"
        >
          Срочные симптомы и правила безопасности →
        </button>
      </Card>

      {blocked ? (
        <Card tone="danger" className="card-pad" role="note">
          <div className="flex items-start gap-3">
            <IconAlert className="mt-0.5 h-6 w-6 shrink-0 text-danger-300" />
            <p className="text-sm leading-relaxed text-danger-100">
              Отмечены тревожные симптомы, поэтому упражнения скрыты. Снимите отметки в дневнике
              после консультации с врачом, если симптомы прошли.
            </p>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
