import { useState } from 'react';
import type { Route } from '../App';
import { CATEGORIES, EXERCISES_BY_ID } from '../data/exercises';
import { useApp } from '../hooks/useAppData';
import { Card, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Controls';
import { ExerciseSketch } from '../components/ExerciseSketch';
import { Button } from '../components/ui/Button';
import { IconAlert } from '../components/ui/Icon';
import { hasRedFlags } from '../types';
import type { ExerciseCategoryId } from '../types';

const DIFFICULTY_LABEL: Record<string, string> = {
  gentle: 'мягкий',
  moderate: 'средний',
  advanced: 'повышенной сложности',
};

export function LibraryPage({ onNavigate }: { onNavigate: (route: Route) => void }) {
  const { data, update } = useApp();
  const [filter, setFilter] = useState<ExerciseCategoryId | 'all'>('all');
  const blocked = hasRedFlags(data.redFlags);
  const inProgram = new Set(data.preferences.program.exerciseIds);

  const toggleInProgram = async (id: string) => {
    const next = inProgram.has(id)
      ? data.preferences.program.exerciseIds.filter((exerciseId) => exerciseId !== id)
      : [...data.preferences.program.exerciseIds, id];
    await update((current) => ({
      ...current,
      preferences: { ...current.preferences, program: { ...current.preferences.program, exerciseIds: next } },
    }));
  };

  return (
    <div className="mx-auto max-w-content space-y-4">
      {blocked ? (
        <Card tone="danger" className="card-pad" role="alert">
          <div className="flex items-start gap-3">
            <IconAlert className="mt-0.5 h-6 w-6 shrink-0 text-danger-300" />
            <p className="text-sm leading-relaxed text-danger-100">
              Отмечены тревожные симптомы, поэтому приложение не предлагает выполнять упражнения.
              Материалы ниже доступны только как справочная информация — обратитесь за медицинской
              помощью.
            </p>
          </div>
        </Card>
      ) : null}

      <Card className="card-pad">
        <CardTitle>Библиотека упражнений</CardTitle>
        <p className="hint mt-2">
          Только упражнения, найденные в авторитетных медицинских источниках: NHS, NICE, AAOS, AANS,
          Mayo Clinic, Cleveland Clinic и рецензируемые публикации. Каждое упражнение содержит
          источник, дату проверки, противопоказания и сигналы для остановки.
        </p>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Фильтр по категориям">
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} label="Все" />
          {CATEGORIES.map((category) => (
            <FilterChip
              key={category.id}
              active={filter === category.id}
              onClick={() => setFilter(category.id)}
              label={category.shortName}
            />
          ))}
        </div>
      </Card>

      {CATEGORIES.filter((category) => filter === 'all' || filter === category.id).map((category) => {
        const exercises = Object.values(EXERCISES_BY_ID).filter(
          (exercise) => exercise.category === category.id,
        );
        if (exercises.length === 0) return null;
        return (
          <section key={category.id} aria-labelledby={`cat-${category.id}`}>
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <h2 id={`cat-${category.id}`} className="text-lg font-semibold text-ink-50">
                {category.name}
              </h2>
              <span className="text-xs text-ink-300">{exercises.length}</span>
            </div>
            <p className="hint mb-3">{category.goal}</p>
            <div className="space-y-3">
              {exercises.map((exercise) => (
                <Card key={exercise.id} className="card-pad">
                  <div className="flex gap-3">
                    <div className="w-28 shrink-0 sm:w-36">
                      <ExerciseSketch
                        pose={exercise.sketch.pose}
                        highlight={exercise.sketch.highlight}
                        title={`Схема: ${exercise.name}`}
                        exerciseId={exercise.id}
                        startingPosition={exercise.startingPosition}
                        steps={exercise.steps}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-ink-50">{exercise.name}</h3>
                      <p className="hint mt-1">{exercise.purpose}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Badge tone="teal">{DIFFICULTY_LABEL[exercise.difficulty]}</Badge>
                        <Badge>
                          {exercise.dosing.unit === 'seconds'
                            ? `${exercise.dosing.value} с × ${exercise.dosing.sets}`
                            : `${exercise.dosing.value} повт. × ${exercise.dosing.sets}`}
                        </Badge>
                        {exercise.flareSafe ? <Badge tone="gold">подходит в болезненный день</Badge> : null}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => onNavigate({ name: 'exercise', id: exercise.id })}>
                      Техника и источник
                    </Button>
                    <Button
                      variant={inProgram.has(exercise.id) ? 'primary' : 'ghost'}
                      aria-pressed={inProgram.has(exercise.id)}
                      onClick={() => void toggleInProgram(exercise.id)}
                    >
                      {inProgram.has(exercise.id) ? 'В программе ✓' : 'Добавить в программу'}
                    </Button>
                    {exercise.dosing.unit === 'seconds' ? (
                      <Button variant="ghost" onClick={() => onNavigate({ name: 'timer' })}>
                        Открыть секундомер
                      </Button>
                    ) : null}
                  </div>
                </Card>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`chip min-h-[40px] ${
        active
          ? 'border-gold-500 bg-gold-600/20 text-gold-100'
          : 'border-ink-600 text-ink-200 hover:border-ink-500'
      }`}
    >
      {label}
    </button>
  );
}
