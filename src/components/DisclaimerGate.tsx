import { useState } from 'react';
import { DISCLAIMER_PARAGRAPHS, DISCLAIMER_TITLE } from '../data/content';
import { RED_FLAG_FIELDS } from '../types';
import { useApp } from '../hooks/useAppData';
import { Card, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { CheckboxRow } from './ui/Controls';
import { IconAlert, IconShield } from './ui/Icon';

/** Shown once, before any exercise content: consent + red-flag screening. */
export function DisclaimerGate() {
  const { data, update, setRedFlags } = useApp();
  const [flags, setFlags] = useState(data.redFlags);
  const [acknowledged, setAcknowledged] = useState(false);
  const anyFlag = Object.values(flags).some(Boolean);

  return (
    <div className="mx-auto max-w-content space-y-4 py-2">
      <Card tone="warn" className="card-pad">
        <CardTitle icon={<IconAlert className="h-6 w-6" />}>{DISCLAIMER_TITLE}</CardTitle>
        <div className="mt-3 space-y-3">
          {DISCLAIMER_PARAGRAPHS.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="text-base leading-relaxed text-ink-100">
              {paragraph}
            </p>
          ))}
        </div>
        <div className="mt-4">
          <CheckboxRow
            label="Я прочитал(а) предупреждение и понимаю, что программу желательно согласовать с врачом, неврологом или физиотерапевтом"
            checked={acknowledged}
            onChange={setAcknowledged}
          />
        </div>
      </Card>

      <Card className="card-pad">
        <CardTitle icon={<IconShield className="h-6 w-6" />}>
          Проверка тревожных симптомов
        </CardTitle>
        <p className="hint mt-2">
          Отметьте то, что наблюдается у вас сейчас. Если отмечен хотя бы один пункт, приложение не
          будет предлагать упражнения и покажет инструкцию обратиться за помощью.
        </p>
        <div className="mt-3">
          {RED_FLAG_FIELDS.map((field) => (
            <CheckboxRow
              key={field.key}
              label={field.label}
              description={field.detail}
              checked={flags[field.key]}
              onChange={(next) => setFlags({ ...flags, [field.key]: next })}
            />
          ))}
        </div>
      </Card>

      {anyFlag ? (
        <Card tone="danger" className="card-pad" role="alert">
          <p className="text-base font-semibold text-danger-100">
            Не начинайте упражнения. Обратитесь за медицинской помощью.
          </p>
          <p className="hint mt-2 text-danger-100">
            Сохраните отметки и свяжитесь с врачом или скорой помощью. Приложение не может оценить
            эти состояния.
          </p>
          <Button
            className="mt-4"
            variant="danger"
            block
            onClick={() => {
              void setRedFlags(flags);
              void update((current) => ({
                ...current,
                preferences: { ...current.preferences, disclaimerAccepted: true },
              }));
            }}
          >
            Сохранить и продолжить к справочной информации
          </Button>
        </Card>
      ) : (
        <Button
          variant="primary"
          size="lg"
          block
          disabled={!acknowledged}
          onClick={() => {
            void setRedFlags(flags);
            void update((current) => ({
              ...current,
              preferences: { ...current.preferences, disclaimerAccepted: true },
            }));
          }}
        >
          Продолжить
        </Button>
      )}

      <p className="hint text-center text-xs">
        Все данные остаются на этом устройстве. Приложение не отправляет их на сервер.
      </p>
    </div>
  );
}
