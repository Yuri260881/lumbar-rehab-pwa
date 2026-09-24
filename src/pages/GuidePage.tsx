import { RED_FLAG_FIELDS } from '../types';
import { Card, CardTitle } from '../components/ui/Card';
import { RedFlagChecklist } from '../components/RedFlagBanner';
import { IconAlert, IconGuide, IconShield } from '../components/ui/Icon';
import {
  RED_FLAGS_INTRO,
  RED_FLAGS_OUTRO,
  RED_FLAGS_TITLE,
  RECOMMENDATIONS,
} from '../data/content';
import { DISCLAIMER_PARAGRAPHS, DISCLAIMER_TITLE } from '../data/content';
import { ALL_SOURCES } from '../data/sources';
import { useApp } from '../hooks/useAppData';

export function GuidePage() {
  const { data } = useApp();

  return (
    <div className="mx-auto max-w-content space-y-4">
      <Card tone="danger" className="card-pad">
        <CardTitle icon={<IconAlert className="h-6 w-6" />}>{RED_FLAGS_TITLE}</CardTitle>
        <p className="mt-2 text-base leading-relaxed text-danger-100">{RED_FLAGS_INTRO}</p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-base text-danger-100">
          {RED_FLAG_FIELDS.map((field) => (
            <li key={field.key}>
              <span className="font-semibold">{field.label}.</span>{' '}
              <span className="text-sm text-danger-300">{field.detail}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-danger-100">{RED_FLAGS_OUTRO}</p>
        <div className="mt-4 rounded-xl border border-danger-600/60 bg-ink-900/60 p-3">
          <p className="text-sm font-semibold text-ink-50">Отметьте, что наблюдается у вас сейчас</p>
          <div className="mt-2">
            <RedFlagChecklist compact />
          </div>
          <p className="hint mt-2">
            {data.redFlagsCheckedAt
              ? `Последняя проверка: ${new Date(data.redFlagsCheckedAt).toLocaleString('ru-RU')}`
              : 'Проверка ещё не выполнялась.'}
          </p>
        </div>
      </Card>

      <Card tone="warn" className="card-pad">
        <CardTitle icon={<IconShield className="h-6 w-6" />}>{DISCLAIMER_TITLE}</CardTitle>
        <div className="mt-3 space-y-2">
          {DISCLAIMER_PARAGRAPHS.map((paragraph) => (
            <p key={paragraph.slice(0, 20)} className="text-base leading-relaxed text-warn-100">
              {paragraph}
            </p>
          ))}
        </div>
      </Card>

      <Card className="card-pad">
        <CardTitle icon={<IconGuide className="h-6 w-6" />}>Рекомендации по реабилитации</CardTitle>
        <p className="hint mt-2">
          Общие принципы, которые встречаются в национальных руководствах и рекомендациях
          медицинских центров. Они не заменяют индивидуальную программу.
        </p>
      </Card>

      {RECOMMENDATIONS.map((recommendation, index) => (
        <Card key={recommendation.id} className="card-pad">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ink-600 text-sm text-ink-300">
              {index + 1}
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-ink-50">{recommendation.title}</h3>
              <p className="mt-2 text-base leading-relaxed text-ink-100">{recommendation.body}</p>
              <ul className="mt-3 space-y-2">
                {recommendation.sources.map((ref) => (
                  <li key={ref.url}>
                    <p className="text-xs uppercase tracking-wide text-ink-400">{ref.organisation}</p>
                    <p className="text-sm text-ink-200">{ref.title}</p>
                    <a
                      className="mt-0.5 inline-block break-all text-sm text-teal-300 underline decoration-teal-600 underline-offset-2"
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {ref.url}
                    </a>
                    <p className="hint">Проверено: {ref.accessedOn}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      ))}

      <Card className="card-pad">
        <CardTitle>Все использованные источники</CardTitle>
        <ul className="mt-3 space-y-3">
          {ALL_SOURCES.map((ref) => (
            <li key={ref.url + ref.title} className="border-b border-ink-700/60 pb-3 last:border-0">
              <p className="text-sm font-semibold text-ink-50">{ref.organisation}</p>
              <p className="text-sm text-ink-200">{ref.title}</p>
              <a
                className="mt-0.5 inline-block break-all text-sm text-teal-300 underline decoration-teal-600 underline-offset-2"
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {ref.url}
              </a>
              <p className="hint">Дата проверки: {ref.accessedOn}</p>
            </li>
          ))}
        </ul>
        <p className="hint mt-3">
          Источники проверялись {ALL_SOURCES[0].accessedOn}. Ссылки могут измениться — в этом случае
          приложение продолжит работать офлайн, но цитирование стоит обновить.
        </p>
      </Card>
    </div>
  );
}
