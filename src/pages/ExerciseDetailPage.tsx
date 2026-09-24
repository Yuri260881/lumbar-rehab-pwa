import type { Route } from '../App';
import { getExercise } from '../data/exercises';
import { Card, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Controls';
import { Button } from '../components/ui/Button';
import { ExerciseSketch } from '../components/ExerciseSketch';
import { IconAlert, IconShield } from '../components/ui/Icon';

const DIFFICULTY_LABEL: Record<string, string> = {
  gentle: 'мягкий уровень',
  moderate: 'средний уровень',
  advanced: 'повышенной сложности — только по согласованию со специалистом',
};

export function ExerciseDetailPage({
  id,
  onNavigate,
}: {
  id: string;
  onNavigate: (route: Route) => void;
}) {
  const exercise = getExercise(id);

  if (!exercise) {
    return (
      <Card className="card-pad">
        <p className="hint">Упражнение не найдено.</p>
        <Button className="mt-3" variant="secondary" onClick={() => onNavigate({ name: 'library' })}>
          К библиотеке
        </Button>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-content space-y-4">
      <Card className="card-pad">
        <h2 className="text-xl font-semibold text-ink-50">{exercise.name}</h2>
        <p className="hint mt-2">{exercise.purpose}</p>
        <div className="mt-3">
          <ExerciseSketch
            pose={exercise.sketch.pose}
            highlight={exercise.sketch.highlight}
            title={`Анатомический эскиз: ${exercise.name}`}
            exerciseId={exercise.id}
            startingPosition={exercise.startingPosition}
            steps={exercise.steps}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge tone="teal">{DIFFICULTY_LABEL[exercise.difficulty]}</Badge>
          <Badge>
            {exercise.dosing.unit === 'seconds'
              ? `удержание ${exercise.dosing.value} с`
              : `${exercise.dosing.value} повторений`}
          </Badge>
          <Badge>{exercise.dosing.sets} подх.</Badge>
          {exercise.dosing.restSeconds > 0 ? <Badge>отдых {exercise.dosing.restSeconds} с</Badge> : null}
        </div>
      </Card>

      <Card className="card-pad">
        <CardTitle>Исходное положение</CardTitle>
        <p className="mt-2 text-base leading-relaxed text-ink-100">{exercise.startingPosition}</p>
      </Card>

      <Card className="card-pad">
        <CardTitle>Техника выполнения</CardTitle>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-base leading-relaxed text-ink-100">
          {exercise.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <div className="mt-4 rounded-xl border border-ink-700 bg-ink-900/60 p-3">
          <p className="text-sm font-semibold text-ink-50">Дыхание</p>
          <p className="hint mt-1">{exercise.breathing}</p>
        </div>
        {exercise.dosing.sourceWording ? (
          <p className="hint mt-3">Дозировка по источнику: {exercise.dosing.sourceWording}</p>
        ) : null}
      </Card>

      {exercise.caution ? (
        <Card tone="warn" className="card-pad">
          <CardTitle icon={<IconAlert className="h-6 w-6" />}>Важно</CardTitle>
          <p className="mt-2 text-base leading-relaxed text-warn-100">{exercise.caution}</p>
        </Card>
      ) : null}

      <Card tone="danger" className="card-pad">
        <CardTitle icon={<IconAlert className="h-6 w-6" />}>Противопоказания</CardTitle>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-danger-100">
          {exercise.contraindications.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>

      <Card tone="danger" className="card-pad">
        <CardTitle icon={<IconShield className="h-6 w-6" />}>Немедленно остановитесь, если</CardTitle>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-danger-100">
          {exercise.stopSignals.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>

      <Card className="card-pad">
        <CardTitle>Источник</CardTitle>
        <ul className="mt-3 space-y-3">
          {exercise.sources.map((ref) => (
            <li key={ref.url + ref.title}>
              <p className="text-sm font-semibold text-ink-50">{ref.organisation}</p>
              <p className="text-sm text-ink-200">{ref.title}</p>
              <a
                className="mt-1 inline-block break-all text-sm text-teal-300 underline decoration-teal-600 underline-offset-2 hover:text-teal-100"
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {ref.url}
              </a>
              <p className="hint mt-1">Дата проверки источника: {ref.accessedOn}</p>
            </li>
          ))}
        </ul>
        <p className="hint mt-3">
          Источник подтверждает существование и общую технику упражнения. Это не индивидуальное
          назначение: программу подбирает врач или физиотерапевт.
        </p>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => onNavigate({ name: 'library' })}>
          К списку упражнений
        </Button>
        {exercise.dosing.unit === 'seconds' ? (
          <Button variant="primary" onClick={() => onNavigate({ name: 'timer' })}>
            Открыть секундомер
          </Button>
        ) : null}
      </div>
    </div>
  );
}
