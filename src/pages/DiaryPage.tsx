import { useMemo, useState } from 'react';
import { useApp } from '../hooks/useAppData';
import { Card, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge, CheckboxRow, Slider, TextField } from '../components/ui/Controls';
import { IconAlert, IconDiary, IconDownload, IconTrash } from '../components/ui/Icon';
import { EXERCISES_BY_ID } from '../data/exercises';
import { RedFlagChecklist } from '../components/RedFlagBanner';
import { createId, formatHumanDate, toDateKey } from '../lib/dates';
import { downloadFile, exportFilename, toCsv, toJson } from '../lib/exporters';
import { hasRedFlags } from '../types';
import type { SleepQuality } from '../types';

export function DiaryPage() {
  const { data, addEntry, deleteEntry } = useApp();
  const todayKey = toDateKey(new Date());
  const existing = data.entries.find((entry) => entry.date === todayKey);

  const [pain, setPain] = useState<number>(existing?.pain ?? 0);
  const [numbness, setNumbness] = useState(existing?.numbness ?? false);
  const [weakness, setWeakness] = useState(existing?.weakness ?? false);
  const [sleep, setSleep] = useState<SleepQuality>((existing?.sleepQuality ?? 3) as SleepQuality);
  const [exercises, setExercises] = useState<string[]>(
    existing?.exercises ??
      data.sessions.find((session) => session.date === todayKey)?.completedExerciseIds ??
      [],
  );
  const [delayed, setDelayed] = useState(existing?.delayedReaction ?? '');
  const [note, setNote] = useState(existing?.note ?? '');
  const [saved, setSaved] = useState(false);

  const performedExercises = useMemo(
    () =>
      Object.values(EXERCISES_BY_ID).filter(
        (exercise) =>
          data.preferences.program.exerciseIds.includes(exercise.id) ||
          exercises.includes(exercise.id),
      ),
    [data.preferences.program.exerciseIds, exercises],
  );

  const redFlagsActive = hasRedFlags(data.redFlags);

  const save = async () => {
    await addEntry({
      id: existing?.id ?? createId('entry'),
      createdAt: new Date().toISOString(),
      date: todayKey,
      pain,
      numbness,
      weakness,
      sleepQuality: sleep,
      exercises,
      delayedReaction: delayed,
      note,
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 4000);
  };

  return (
    <div className="mx-auto max-w-content space-y-4">
      <Card className="card-pad">
        <CardTitle icon={<IconDiary className="h-6 w-6" />}>Запись за сегодня</CardTitle>
        <p className="hint mt-1">
          {formatHumanDate(todayKey)} · данные хранятся только на этом устройстве
        </p>

        <div className="mt-4 space-y-5">
          <Slider
            label="Уровень боли"
            value={pain}
            min={0}
            max={10}
            onChange={setPain}
            valueLabel={`${pain} / 10`}
          />

          <div className="rounded-xl border border-ink-700 bg-ink-900/50 p-3">
            <CheckboxRow
              label="Онемение"
              description="Онемение или покалывание в ноге, стопе."
              checked={numbness}
              onChange={setNumbness}
            />
            <CheckboxRow
              label="Слабость"
              description="Слабость в ноге или стопе, трудно встать на носки/пятки."
              checked={weakness}
              onChange={setWeakness}
            />
          </div>

          <div>
            <span className="label">Качество сна</span>
            <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Качество сна">
              {([1, 2, 3, 4, 5] as SleepQuality[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={sleep === value}
                  onClick={() => setSleep(value)}
                  className={`h-12 w-12 rounded-xl border text-lg font-semibold
                    ${
                      sleep === value
                        ? 'border-teal-500 bg-teal-600/30 text-teal-100'
                        : 'border-ink-600 bg-ink-850 text-ink-200 hover:border-ink-500'
                    }`}
                >
                  {value}
                </button>
              ))}
            </div>
            <p className="hint mt-1">1 — очень плохо, 5 — хорошо выспался.</p>
          </div>

          <div>
            <span className="label">Выполненные упражнения</span>
            <div className="mt-2 space-y-1">
              {performedExercises.map((exercise) => (
                <CheckboxRow
                  key={exercise.id}
                  label={exercise.name}
                  checked={exercises.includes(exercise.id)}
                  onChange={(next) =>
                    setExercises((current) =>
                      next
                        ? [...current, exercise.id]
                        : current.filter((id) => id !== exercise.id),
                    )
                  }
                />
              ))}
            </div>
          </div>

          <TextField
            label="Реакция через несколько часов после упражнений"
            value={delayed}
            onChange={setDelayed}
            rows={3}
            placeholder="Например: через 3 часа боль чуть ниже, к вечеру снова усилилась"
            hint="Эта запись особенно полезна для врача: она показывает отсроченную реакцию на нагрузку."
          />

          <TextField
            label="Комментарий"
            value={note}
            onChange={setNote}
            rows={3}
            placeholder="Что заметили сегодня"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="primary" size="lg" onClick={() => void save()}>
            {existing ? 'Обновить запись' : 'Сохранить запись'}
          </Button>
          {saved ? <span className="self-center text-sm text-teal-300">Сохранено</span> : null}
        </div>
      </Card>

      {numbness || weakness ? (
        <Card tone="warn" className="card-pad">
          <div className="flex items-start gap-3">
            <IconAlert className="mt-0.5 h-6 w-6 shrink-0 text-warn-300" />
            <p className="text-sm leading-relaxed text-warn-100">
              Вы отметили онемение или слабость. Приложение не ставит диагноз и не подбирает лечение
              по одному симптому. Если симптомы новые, нарастают или сопровождаются другими
              тревожными признаками — обратитесь к врачу. При признаках из списка ниже — немедленно.
            </p>
          </div>
        </Card>
      ) : null}

      {redFlagsActive ? (
        <Card tone="danger" className="card-pad" role="alert">
          <p className="text-sm leading-relaxed text-danger-100">
            Активны тревожные симптомы — упражнения скрыты. Снимите отметки ниже только после
            консультации с врачом, если симптомы прошли.
          </p>
        </Card>
      ) : null}

      <Card className="card-pad">
        <CardTitle icon={<IconAlert className="h-6 w-6" />}>Тревожные симптомы</CardTitle>
        <div className="mt-3">
          <RedFlagChecklist compact />
        </div>
      </Card>

      <Card className="card-pad">
        <CardTitle>Экспорт дневника</CardTitle>
        <p className="hint mt-2">
          Файл формируется на устройстве и скачивается в браузер. Ничего не отправляется на сервер.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => downloadFile(exportFilename('lumbar-rehab-diary', 'json'), toJson(data), 'application/json')}
          >
            <IconDownload className="h-5 w-5" />
            Скачать JSON
          </Button>
          <Button
            variant="secondary"
            onClick={() => downloadFile(exportFilename('lumbar-rehab-diary', 'csv'), toCsv(data), 'text/csv')}
          >
            <IconDownload className="h-5 w-5" />
            Скачать CSV
          </Button>
        </div>
      </Card>

      <Card className="card-pad">
        <CardTitle>История записей</CardTitle>
        {data.entries.length === 0 ? (
          <p className="hint mt-2">Записей пока нет.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {data.entries.map((entry) => (
              <li key={entry.id} className="rounded-xl border border-ink-700 bg-ink-900/50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-base text-ink-50">{formatHumanDate(entry.date)}</span>
                  <span className="flex flex-wrap gap-1.5">
                    <Badge tone={entry.pain !== null && entry.pain >= 7 ? 'danger' : 'teal'}>
                      боль {entry.pain ?? '—'}/10
                    </Badge>
                    <Badge>сон {entry.sleepQuality ?? '—'}/5</Badge>
                    {entry.numbness ? <Badge tone="warn">онемение</Badge> : null}
                    {entry.weakness ? <Badge tone="warn">слабость</Badge> : null}
                  </span>
                </div>
                {entry.exercises.length > 0 ? (
                  <p className="hint mt-2">
                    {entry.exercises
                      .map((id) => EXERCISES_BY_ID[id]?.name ?? id)
                      .join(', ')}
                  </p>
                ) : null}
                {entry.delayedReaction ? (
                  <p className="hint mt-1">Реакция: {entry.delayedReaction}</p>
                ) : null}
                {entry.note ? <p className="hint mt-1">{entry.note}</p> : null}
                <Button
                  className="mt-2"
                  variant="ghost"
                  onClick={() => void deleteEntry(entry.id)}
                >
                  <IconTrash className="h-4 w-4" />
                  Удалить запись
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
