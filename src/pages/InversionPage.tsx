import { useMemo, useState } from 'react';
import { useApp } from '../hooks/useAppData';
import { Card, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge, CheckboxRow, TextField, Toggle } from '../components/ui/Controls';
import { IconAlert, IconInversion } from '../components/ui/Icon';
import {
  INVERSION_CHECKLIST,
  INVERSION_CONTRAINDICATIONS,
  INVERSION_DISCLAIMER,
  INVERSION_STOP_SIGNALS,
} from '../data/content';
import { SOURCES } from '../data/sources';
import {
  addDays,
  createId,
  formatHumanDate,
  relativeDaysLabel,
  toDateKey,
  todayKey,
} from '../lib/dates';
import { inversionDayStatus } from '../lib/notifications';
import { hasRedFlags } from '../types';

export function InversionPage() {
  const { data, update, addInversionSession } = useApp();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [feltAfter, setFeltAfter] = useState('');
  const [warningSymptoms, setWarningSymptoms] = useState(false);
  const [logNote, setLogNote] = useState('');
  const approved = data.preferences.inversionDoctorApproved;
  const anchor = data.preferences.inversionAnchorDate;
  const everyN = data.preferences.reminders.inversion.everyNDays;
  const blocked = hasRedFlags(data.redFlags);

  const today = todayKey();
  const status = inversionDayStatus(anchor, everyN, today);
  const allChecked = INVERSION_CHECKLIST.every((item) => checked[item.id] === true);

  const month = useMemo(() => {
    const base = new Date();
    const start = new Date(base.getFullYear(), base.getMonth(), 1);
    const days: Array<{ key: string; day: number; status: string }> = [];
    for (let index = 0; index < 35; index += 1) {
      const date = addDays(start, index);
      if (date.getMonth() !== base.getMonth()) break;
      const key = toDateKey(date);
      days.push({ key, day: date.getDate(), status: inversionDayStatus(anchor, everyN, key) });
    }
    return days;
  }, [anchor, everyN]);

  const setApproved = async (next: boolean) => {
    await update((current) => ({
      ...current,
      preferences: {
        ...current.preferences,
        inversionDoctorApproved: next,
        inversionAnchorDate: next ? current.preferences.inversionAnchorDate ?? todayKey() : null,
        reminders: {
          ...current.preferences.reminders,
          inversion: { ...current.preferences.reminders.inversion, enabled: next && current.preferences.reminders.inversion.enabled },
        },
      },
    }));
  };

  const recordSession = async (sessionStatus: 'done' | 'skipped') => {
    await addInversionSession({
      id: createId('inversion'),
      date: today,
      status: sessionStatus,
      note: logNote,
      feltAfter: sessionStatus === 'done' ? feltAfter : '',
      warningSymptoms: sessionStatus === 'done' ? warningSymptoms : false,
    });
    setFeltAfter('');
    setWarningSymptoms(false);
    setLogNote('');
    setChecked({});
  };

  return (
    <div className="mx-auto max-w-content space-y-4">
      <Card tone="warn" className="card-pad">
        <CardTitle icon={<IconInversion className="h-6 w-6" />}>Инверсионный стол — только как дополнительная опция</CardTitle>
        <div className="mt-3 space-y-2">
          {INVERSION_DISCLAIMER.map((paragraph) => (
            <p key={paragraph.slice(0, 20)} className="text-base leading-relaxed text-warn-100">
              {paragraph}
            </p>
          ))}
        </div>
      </Card>

      <Card className="card-pad">
        <CardTitle>Разрешение врача</CardTitle>
        <div className="mt-3">
          <Toggle
            label="Врач разрешил мне использовать инверсионный стол"
            description="Без этого подтверждения раздел остаётся в режиме «только информация», а напоминания не включаются."
            checked={approved}
            onChange={(next) => void setApproved(next)}
          />
        </div>
        {approved ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tone="teal">подтверждено пользователем</Badge>
            <span className="hint">
              Начало схемы: {anchor ? formatHumanDate(anchor) : 'не задано'} · интервал: каждый{' '}
              {everyN}-й день
            </span>
            <Button
              variant="ghost"
              onClick={() =>
                void update((current) => ({
                  ...current,
                  preferences: { ...current.preferences, inversionAnchorDate: todayKey() },
                }))
              }
            >
              Начать схему с сегодня
            </Button>
          </div>
        ) : (
          <p className="hint mt-2">
            Приложение не может оценить, подходит ли вам инверсия. Разрешение даёт врач, знающий ваш
            диагноз и сопутствующие состояния.
          </p>
        )}
      </Card>

      {blocked ? (
        <Card tone="danger" className="card-pad" role="alert">
          <div className="flex items-start gap-3">
            <IconAlert className="mt-0.5 h-6 w-6 shrink-0 text-danger-300" />
            <p className="text-sm leading-relaxed text-danger-100">
              Отмечены тревожные симптомы. Использование инверсионного стола в этом состоянии
              недопустимо — обратитесь за медицинской помощью.
            </p>
          </div>
        </Card>
      ) : null}

      {approved ? (
        <>
          <Card className="card-pad">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Календарь через день</CardTitle>
              <Badge tone={status === 'session' ? 'teal' : 'neutral'}>
                {status === 'session'
                  ? 'сегодня день сеанса'
                  : status === 'before-start'
                    ? 'схема ещё не начата'
                    : 'сегодня день отдыха'}
              </Badge>
            </div>
            <p className="hint mt-2">
              Следующий сеанс: {relativeDaysLabel(
                inversionDayStatus(anchor, everyN, today) === 'session'
                  ? today
                  : toDateKey(addDays(new Date(), everyN - 1)),
              )}
            </p>
            <div className="mt-4 grid grid-cols-7 gap-1.5" role="list" aria-label="Календарь сеансов">
              {['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'].map((day) => (
                <div key={day} className="text-center text-xs text-ink-400">
                  {day}
                </div>
              ))}
              {month.map((cell) => {
                const isToday = cell.key === today;
                const record = data.inversionSessions.find((item) => item.date === cell.key);
                return (
                  <div
                    key={cell.key}
                    role="listitem"
                    aria-label={`${formatHumanDate(cell.key)}: ${
                      record
                        ? record.status === 'done'
                          ? 'сеанс выполнен'
                          : 'пропущено'
                        : cell.status === 'session'
                          ? 'день сеанса'
                          : 'день отдыха'
                    }`}
                    className={`flex h-11 flex-col items-center justify-center rounded-lg border text-sm
                      ${isToday ? 'border-gold-500 text-gold-100' : 'border-ink-700 text-ink-200'}
                      ${cell.status === 'session' ? 'bg-teal-700/20' : 'bg-ink-900/50'}`}
                  >
                    <span>{cell.day}</span>
                    {record ? (
                      <span aria-hidden="true" className="text-[10px]">
                        {record.status === 'done' ? '✓' : '—'}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="card-pad">
            <CardTitle>Чек-лист перед использованием</CardTitle>
            <div className="mt-3">
              {INVERSION_CHECKLIST.map((item) => (
                <CheckboxRow
                  key={item.id}
                  label={item.label}
                  description={item.detail}
                  checked={checked[item.id] === true}
                  onChange={(next) => setChecked((current) => ({ ...current, [item.id]: next }))}
                />
              ))}
            </div>
            <p className="hint mt-3">
              {allChecked
                ? 'Чек-лист пройден. Начинайте с минимального наклона и короткого времени.'
                : 'Отметьте все пункты, прежде чем вставать на стол.'}
            </p>
          </Card>

          <Card className="card-pad">
            <CardTitle>Записать результат</CardTitle>
            <div className="mt-3 space-y-3">
              <TextField
                label="Самочувствие после сеанса"
                value={feltAfter}
                onChange={setFeltAfter}
                rows={2}
                placeholder="Например: лёгкое облегчение на 1–2 часа"
                hint="Свободная форма. Приложение не запрашивает и не хранит угол наклона и длительность."
              />
              <TextField label="Заметка" value={logNote} onChange={setLogNote} rows={2} />
              <CheckboxRow
                label="Во время или после сеанса появились тревожные симптомы"
                description="Головная боль, головокружение, изменения зрения, тошнота, усиление боли, онемение или слабость."
                checked={warningSymptoms}
                onChange={setWarningSymptoms}
              />
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" disabled={!allChecked} onClick={() => void recordSession('done')}>
                  Отметить сеанс выполненным
                </Button>
                <Button variant="secondary" onClick={() => void recordSession('skipped')}>
                  Пропустить этот день
                </Button>
              </div>
            </div>
            {warningSymptoms ? (
              <p className="mt-3 rounded-xl border border-danger-600/60 bg-danger-700/15 p-3 text-sm text-danger-100">
                Прекратите использование и обратитесь к врачу. При появлении симптомов из раздела
                «Срочно обратиться за помощью» — немедленно.
              </p>
            ) : null}
          </Card>

          <Card className="card-pad">
            <CardTitle>Журнал</CardTitle>
            {data.inversionSessions.length === 0 ? (
              <p className="hint mt-2">Записей пока нет.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {[...data.inversionSessions].reverse().slice(0, 14).map((item) => (
                  <li key={item.id} className="rounded-xl border border-ink-700 bg-ink-900/50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-base text-ink-50">{formatHumanDate(item.date)}</span>
                      <Badge tone={item.status === 'done' ? 'teal' : 'neutral'}>
                        {item.status === 'done' ? 'сеанс' : 'пропуск'}
                      </Badge>
                    </div>
                    {item.feltAfter ? <p className="hint mt-1">{item.feltAfter}</p> : null}
                    {item.note ? <p className="hint mt-1">{item.note}</p> : null}
                    {item.warningSymptoms ? (
                      <p className="mt-1 text-sm text-danger-300">Отмечены тревожные симптомы</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      ) : null}

      <Card tone="danger" className="card-pad">
        <CardTitle icon={<IconAlert className="h-6 w-6" />}>Когда стол использовать нельзя</CardTitle>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-danger-100">
          {INVERSION_CONTRAINDICATIONS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="hint mt-3">
          Список основан на описании рисков инверсии: рост артериального и внутриглазного давления,
          нагрузка на сердечно-сосудистую систему, риск падения.
        </p>
      </Card>

      <Card tone="danger" className="card-pad">
        <CardTitle>Немедленно прекратите сеанс при</CardTitle>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-danger-100">
          {INVERSION_STOP_SIGNALS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>

      <Card className="card-pad">
        <CardTitle>Что говорят руководства</CardTitle>
        <ul className="mt-3 space-y-3">
          {[SOURCES.niceNg59, SOURCES.acp2017].map((ref) => (
            <li key={ref.url}>
              <p className="text-sm font-semibold text-ink-50">{ref.organisation}</p>
              <p className="text-sm text-ink-200">{ref.title}</p>
              <a
                className="mt-1 inline-block break-all text-sm text-teal-300 underline decoration-teal-600 underline-offset-2"
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
          NICE NG59 не рекомендует тракцию для ведения боли в спине и ишиаса; клиническое руководство
          ACP указывает на недостаточность доказательств эффективности инверсии. Поэтому приложение
          не преподносит инверсионный стол как способ лечения.
        </p>
      </Card>
    </div>
  );
}
