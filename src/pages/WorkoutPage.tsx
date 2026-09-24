import { useMemo, useState } from 'react';
import type { Route } from '../App';
import { EXERCISES_BY_ID } from '../data/exercises';
import { useApp } from '../hooks/useAppData';
import { Card, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge, Progress, Slider } from '../components/ui/Controls';
import { ExerciseSketch } from '../components/ExerciseSketch';
import { IconAlert, IconPlay } from '../components/ui/Icon';
import { createId, formatClock, toDateKey } from '../lib/dates';
import { unlockAudio } from '../lib/audio';
import { hasRedFlags } from '../types';

export function WorkoutPage({ onNavigate }: { onNavigate: (route: Route) => void }) {
  const { data, addSession } = useApp();
  const [index, setIndex] = useState(0);
  const [completed, setCompleted] = useState<string[]>([]);
  const [painBefore, setPainBefore] = useState(0);
  const [startedAt] = useState(() => new Date());
  const [finished, setFinished] = useState(false);

  const flareOnly = data.preferences.program.flareOnly;
  const blocked = hasRedFlags(data.redFlags);

  const program = useMemo(
    () =>
      data.preferences.program.exerciseIds
        .map((id) => EXERCISES_BY_ID[id])
        .filter((exercise): exercise is NonNullable<typeof exercise> => Boolean(exercise))
        .filter((exercise) => (flareOnly ? exercise.flareSafe : true)),
    [data.preferences.program.exerciseIds, flareOnly],
  );

  const current = program[Math.min(index, program.length - 1)];

  if (blocked) {
    return (
      <Card tone="danger" className="card-pad mx-auto max-w-content" role="alert">
        <CardTitle icon={<IconAlert className="h-6 w-6" />}>Тренировка недоступна</CardTitle>
        <p className="mt-2 text-base leading-relaxed text-danger-100">
          Вы отметили тревожные симптомы. Приложение не предлагает упражнения в этом состоянии.
          Обратитесь за медицинской помощью — решение о нагрузке принимает врач.
        </p>
        <Button className="mt-4" variant="secondary" onClick={() => onNavigate({ name: 'guide' })}>
          Открыть раздел безопасности
        </Button>
      </Card>
    );
  }

  if (program.length === 0) {
    return (
      <Card className="card-pad mx-auto max-w-content">
        <CardTitle>Программа пуста</CardTitle>
        <p className="hint mt-2">
          Добавьте упражнения в программу из библиотеки. Начинайте с мягких упражнений и
          согласуйте план со специалистом.
        </p>
        <Button className="mt-4" variant="primary" onClick={() => onNavigate({ name: 'library' })}>
          Открыть библиотеку
        </Button>
      </Card>
    );
  }

  const completeCurrent = async () => {
    unlockAudio();
    const nextCompleted = completed.includes(current.id) ? completed : [...completed, current.id];
    setCompleted(nextCompleted);
    if (index + 1 < program.length) {
      setIndex(index + 1);
      return;
    }
    const endedAt = new Date();
    await addSession({
      id: createId('session'),
      date: toDateKey(endedAt),
      startedAt: startedAt.toISOString(),
      finishedAt: endedAt.toISOString(),
      exerciseIds: program.map((exercise) => exercise.id),
      completedExerciseIds: nextCompleted,
      painIncreased: false,
      stoppedEarly: false,
      durationSeconds: Math.round((endedAt.getTime() - startedAt.getTime()) / 1000),
    });
    setFinished(true);
  };

  if (finished) {
    return (
      <div className="mx-auto max-w-content space-y-4">
        <Card tone="accent" className="card-pad">
          <CardTitle>Занятие завершено</CardTitle>
          <p className="hint mt-2">
            Выполнено {completed.length} из {program.length} упражнений. Запишите самочувствие — это
            помогает отслеживать реакцию на нагрузку.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => onNavigate({ name: 'diary' })}>
              Заполнить дневник
            </Button>
            <Button variant="secondary" onClick={() => onNavigate({ name: 'dashboard' })}>
              На главную
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-content space-y-4">
      <Card className="card-pad">
        <Progress
          value={index + 1}
          max={program.length}
          label={`Упражнение ${index + 1} из ${program.length}`}
        />
        {flareOnly ? (
          <p className="hint mt-2">
            Включён режим «бережный день»: показаны только упражнения, подходящие при усилении
            симптомов.
          </p>
        ) : null}
      </Card>

      <Card className="card-pad">
        <h2 className="text-xl font-semibold text-ink-50">{current.name}</h2>
        <p className="hint mt-1">{current.purpose}</p>
        <div className="mt-3">
          <ExerciseSketch
            pose={current.sketch.pose}
            highlight={current.sketch.highlight}
            title={`Анатомический эскиз: ${current.name}`}
            startingPosition={current.startingPosition}
            steps={current.steps}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge tone="teal">
            {current.dosing.unit === 'seconds'
              ? `${current.dosing.value} с × ${current.dosing.sets}`
              : `${current.dosing.value} повт. × ${current.dosing.sets}`}
          </Badge>
          {current.dosing.restSeconds > 0 ? <Badge>отдых {current.dosing.restSeconds} с</Badge> : null}
        </div>

        <ol className="mt-4 list-decimal space-y-2 pl-5 text-base leading-relaxed text-ink-100">
          {current.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>

        <div className="mt-4 rounded-xl border border-ink-700 bg-ink-900/60 p-3">
          <p className="text-sm font-semibold text-ink-50">Дыхание</p>
          <p className="hint mt-1">{current.breathing}</p>
        </div>

        {current.caution ? (
          <p className="mt-3 rounded-xl border border-warn-600/60 bg-warn-600/10 p-3 text-sm text-warn-100">
            {current.caution}
          </p>
        ) : null}

        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-danger-100">
          {current.stopSignals.slice(0, 3).map((signal) => (
            <li key={signal}>{signal}</li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="primary" size="lg" onClick={() => void completeCurrent()}>
            <IconPlay className="h-5 w-5" />
            {index + 1 < program.length ? 'Выполнено, далее' : 'Завершить занятие'}
          </Button>
          {current.dosing.unit === 'seconds' ? (
            <Button variant="secondary" onClick={() => onNavigate({ name: 'timer' })}>
              Секундомер
            </Button>
          ) : null}
          <Button variant="ghost" onClick={() => onNavigate({ name: 'exercise', id: current.id })}>
            Подробно и источник
          </Button>
        </div>
      </Card>

      <Card className="card-pad">
        <Slider
          label="Боль до занятия (для записи в дневник)"
          value={painBefore}
          min={0}
          max={10}
          onChange={setPainBefore}
          valueLabel={`${painBefore} / 10`}
        />
        <p className="hint mt-2">
          Текущая длительность занятия: {formatClock(Math.round((Date.now() - startedAt.getTime()) / 1000))}.
          Если боль усиливается — остановитесь, это не «плохая тренировка», а сигнал снизить нагрузку.
        </p>
      </Card>
    </div>
  );
}
