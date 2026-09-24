import { useState } from 'react';
import { RED_FLAG_FIELDS, hasRedFlags } from '../types';
import { useApp } from '../hooks/useAppData';
import { Card, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { CheckboxRow } from './ui/Controls';
import { IconAlert } from './ui/Icon';
import { RED_FLAGS_INTRO, RED_FLAGS_OUTRO, RED_FLAGS_TITLE } from '../data/content';

/**
 * Safety interlock.
 *
 * When the user reports any red-flag symptom the app stops suggesting
 * exercises entirely and points to medical care. This is deliberately
 * unconditional: no risk scoring, no per-symptom advice.
 */
export function RedFlagBanner() {
  const { data, clearRedFlags } = useApp();
  const [expanded, setExpanded] = useState(false);
  const active = hasRedFlags(data.redFlags);

  if (!active) return null;

  const activeFields = RED_FLAG_FIELDS.filter((field) => data.redFlags[field.key]);

  return (
    <Card tone="danger" className="card-pad mb-4" role="alert">
      <CardTitle icon={<IconAlert className="h-6 w-6" />}>
        Остановитесь и обратитесь за медицинской помощью
      </CardTitle>
      <p className="mt-2 text-base leading-relaxed text-danger-100">
        Вы отметили тревожные симптомы. Приложение не предлагает упражнения, пока эти отметки
        активны. Свяжитесь с врачом или службой скорой помощи — приложение не может оценить такие
        состояния.
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-danger-100">
        {activeFields.map((field) => (
          <li key={field.key}>{field.label}</li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setExpanded((value) => !value)}>
          {expanded ? 'Скрыть список' : 'Показать весь список тревожных симптомов'}
        </Button>
        <Button variant="danger" onClick={() => void clearRedFlags()}>
          Симптомы прошли / отметил(а) по ошибке
        </Button>
      </div>

      {expanded ? (
        <div className="mt-4 rounded-xl border border-danger-600/50 bg-ink-900/60 p-3">
          <p className="hint">{RED_FLAGS_INTRO}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-100">
            {RED_FLAG_FIELDS.map((field) => (
              <li key={field.key}>{field.label}</li>
            ))}
          </ul>
          <p className="hint mt-2">{RED_FLAGS_OUTRO}</p>
        </div>
      ) : null}
    </Card>
  );
}

/** Reusable red-flag checklist used by the diary and the workout start flow. */
export function RedFlagChecklist({ compact = false }: { compact?: boolean }) {
  const { data, setRedFlags } = useApp();
  return (
    <div>
      {!compact ? <p className="hint mb-2">{RED_FLAGS_INTRO}</p> : null}
      <fieldset>
        <legend className="sr-only">{RED_FLAGS_TITLE}</legend>
        {RED_FLAG_FIELDS.map((field) => (
          <CheckboxRow
            key={field.key}
            label={field.label}
            description={compact ? undefined : field.detail}
            checked={data.redFlags[field.key]}
            onChange={(next) => void setRedFlags({ ...data.redFlags, [field.key]: next })}
          />
        ))}
      </fieldset>
    </div>
  );
}
