import { useState } from 'react';
import { useApp } from '../hooks/useAppData';
import type { Route } from '../App';
import { Card, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge, TextField, Toggle } from '../components/ui/Controls';
import {
  IconBell,
  IconDownload,
  IconGuide,
  IconInversion,
  IconShield,
  IconTrash,
} from '../components/ui/Icon';
import { downloadFile, exportFilename, toCsv, toJson } from '../lib/exporters';
import { DISCLAIMER_PARAGRAPHS, DISCLAIMER_TITLE } from '../data/content';

const SECTIONS: Array<{ route: Route; label: string; hint: string; icon: typeof IconBell }> = [
  {
    route: { name: 'reminders' },
    label: 'Напоминания',
    hint: 'Время тренировки, инверсия через день, история',
    icon: IconBell,
  },
  {
    route: { name: 'inversion' },
    label: 'Инверсионный стол',
    hint: 'Календарь, чек-лист, журнал сеансов',
    icon: IconInversion,
  },
  {
    route: { name: 'guide' },
    label: 'Рекомендации и безопасность',
    hint: 'Источники, тревожные симптомы, чего избегать',
    icon: IconGuide,
  },
];

export function SettingsPage({ onNavigate }: { onNavigate: (route: Route) => void }) {
  const { data, update, wipeAllData, storageKind, capabilities, serviceWorkerReady } = useApp();
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const storageLabel: Record<string, string> = {
    indexeddb: 'IndexedDB (локально)',
    localstorage: 'localStorage (локально)',
    memory: 'только в памяти — записи не сохранятся',
  };

  return (
    <div className="mx-auto max-w-content space-y-4">
      <Card className="card-pad">
        <CardTitle>Разделы</CardTitle>
        <ul className="mt-3 space-y-2">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <li key={section.route.name}>
                <button
                  type="button"
                  onClick={() => onNavigate(section.route)}
                  className="btn-secondary w-full justify-between text-left"
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-gold-300" />
                    <span className="min-w-0">
                      <span className="block text-base font-medium text-ink-50">{section.label}</span>
                      <span className="block text-xs text-ink-300">{section.hint}</span>
                    </span>
                  </span>
                  <span aria-hidden="true" className="text-ink-400">
                    ›
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="card-pad">
        <CardTitle>Профиль</CardTitle>
        <div className="mt-3">
          <TextField
            label="Имя (необязательно)"
            value={data.preferences.displayName}
            onChange={(next) =>
              void update((current) => ({
                ...current,
                preferences: { ...current.preferences, displayName: next },
              }))
            }
            maxLength={40}
            hint="Хранится только на этом устройстве и используется в приветствии."
          />
        </div>
        <div className="mt-4">
          <Toggle
            label="Режим «бережный день»"
            description="В тренировке показывать только упражнения, подходящие при усилении симптомов."
            checked={data.preferences.program.flareOnly}
            onChange={(next) =>
              void update((current) => ({
                ...current,
                preferences: {
                  ...current.preferences,
                  program: { ...current.preferences.program, flareOnly: next },
                },
              }))
            }
          />
          <Toggle
            label="Уменьшить анимацию"
            description="Дополнительно к системной настройке prefers-reduced-motion."
            checked={data.preferences.reducedMotion}
            onChange={(next) =>
              void update((current) => ({
                ...current,
                preferences: { ...current.preferences, reducedMotion: next },
              }))
            }
          />
        </div>
      </Card>

      <Card className="card-pad">
        <CardTitle>Хранение данных</CardTitle>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge tone={storageKind === 'memory' ? 'warn' : 'teal'}>
            {storageLabel[storageKind] ?? storageKind}
          </Badge>
          <Badge tone={serviceWorkerReady ? 'teal' : 'warn'}>
            офлайн-режим: {serviceWorkerReady ? 'готов' : 'ожидает первой загрузки'}
          </Badge>
          <Badge>
            уведомлений в браузере: {capabilities.permission === 'granted' ? 'разрешено' : capabilities.permission}
          </Badge>
        </div>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-ink-200">
          <li>Все записи хранятся локально в этом браузере.</li>
          <li>Сервера, аналитики и отправки медицинских данных нет.</li>
          <li>
            Очистка данных браузера, смена браузера или устройства удаляют записи — используйте
            экспорт.
          </li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() =>
              downloadFile(exportFilename('lumbar-rehab-backup', 'json'), toJson(data), 'application/json')
            }
          >
            <IconDownload className="h-5 w-5" />
            Экспорт JSON
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              downloadFile(exportFilename('lumbar-rehab-diary', 'csv'), toCsv(data), 'text/csv')
            }
          >
            <IconDownload className="h-5 w-5" />
            Экспорт CSV
          </Button>
        </div>
      </Card>

      <Card tone="danger" className="card-pad">
        <CardTitle icon={<IconTrash className="h-6 w-6" />}>Полное удаление локальных данных</CardTitle>
        <p className="hint mt-2">
          Удаляются дневник, история тренировок, журнал инверсионного стола, настройки и отметки
          тревожных симптомов. Действие необратимо.
        </p>
        {!confirmWipe ? (
          <Button className="mt-4" variant="danger" onClick={() => setConfirmWipe(true)}>
            Удалить все данные
          </Button>
        ) : (
          <div className="mt-4 space-y-3">
            <TextField
              label="Введите УДАЛИТЬ для подтверждения"
              value={confirmText}
              onChange={setConfirmText}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="danger"
                disabled={confirmText.trim().toUpperCase() !== 'УДАЛИТЬ'}
                onClick={async () => {
                  await wipeAllData();
                  setConfirmText('');
                  setConfirmWipe(false);
                }}
              >
                Подтвердить удаление
              </Button>
              <Button variant="ghost" onClick={() => setConfirmWipe(false)}>
                Отмена
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card tone="warn" className="card-pad">
        <CardTitle icon={<IconShield className="h-6 w-6" />}>{DISCLAIMER_TITLE}</CardTitle>
        <div className="mt-3 space-y-2">
          {DISCLAIMER_PARAGRAPHS.map((paragraph) => (
            <p key={paragraph.slice(0, 20)} className="text-sm leading-relaxed text-warn-100">
              {paragraph}
            </p>
          ))}
        </div>
        <Button
          className="mt-4"
          variant="ghost"
          onClick={() =>
            void update((current) => ({
              ...current,
              preferences: { ...current.preferences, disclaimerAccepted: false },
            }))
          }
        >
          Показать стартовое предупреждение снова
        </Button>
      </Card>

      <Card className="card-pad">
        <CardTitle>О приложении</CardTitle>
        <p className="hint mt-2">
          Lumbar Rehab Dashboard v0.1.0 · офлайн-PWA · React + TypeScript + Vite + Tailwind ·
          локальное хранилище IndexedDB.
        </p>
        <p className="hint mt-2">
          Приложение не является медицинским изделием и не заменяет консультацию врача, невролога или
          физиотерапевта.
        </p>
      </Card>
    </div>
  );
}
