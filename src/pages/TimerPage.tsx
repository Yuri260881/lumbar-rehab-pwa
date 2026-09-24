import { useState } from 'react';
import { useApp } from '../hooks/useAppData';
import { useCountdownTimer } from '../hooks/useCountdownTimer';
import { Card, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge, Stepper, Toggle } from '../components/ui/Controls';
import { IconNext, IconPause, IconPlay, IconReset } from '../components/ui/Icon';
import { formatClock } from '../lib/dates';
import { isAudioSupported } from '../lib/audio';
import { isVibrationSupported } from '../lib/haptics';

const PHASE_LABEL: Record<string, string> = {
  idle: 'Готов к началу',
  hold: 'Удержание',
  rest: 'Отдых',
  finished: 'Готово',
};

export function TimerPage() {
  const { data, update } = useApp();
  const timerPrefs = data.preferences.timer;
  const [showSettings, setShowSettings] = useState(false);
  const [completedSets, setCompletedSets] = useState(0);

  const {
    state,
    startTimer,
    pauseTimer,
    resetTimer,
    skipToNextSet,
    changeConfig,
    wakeLockActive,
    wakeLockSupported,
  } = useCountdownTimer(
    {
      holdSeconds: timerPrefs.holdSeconds,
      sets: timerPrefs.sets,
      restSeconds: timerPrefs.restSeconds,
    },
    {
      sound: timerPrefs.sound,
      vibration: timerPrefs.vibration,
      wakeLock: timerPrefs.wakeLock,
      onFinished: () => setCompletedSets((value) => value + 1),
    },
  );

  const patchPrefs = async (patch: Partial<typeof timerPrefs>) => {
    await update((current) => ({
      ...current,
      preferences: { ...current.preferences, timer: { ...current.preferences.timer, ...patch } },
    }));
  };

  const totalSeconds = Math.ceil(state.remainingSeconds);
  const isRest = state.phase === 'rest';

  return (
    <div className="mx-auto max-w-content space-y-4">
      <Card className="card-pad">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Секундомер для статических упражнений</CardTitle>
          <Badge tone={isRest ? 'warn' : 'teal'}>{PHASE_LABEL[state.phase]}</Badge>
        </div>

        <div
          className="mt-6 flex flex-col items-center"
          role="timer"
          aria-live="off"
          aria-atomic="true"
        >
          <p
            className="font-mono text-[5.5rem] font-semibold leading-none tabular-nums text-ink-50 sm:text-[7rem]"
            aria-label={`Осталось ${formatClock(totalSeconds)}`}
          >
            {formatClock(totalSeconds)}
          </p>
          <p className="mt-3 text-lg text-ink-200">
            Подход <span className="font-semibold text-ink-50">{state.currentSet}</span> из{' '}
            {state.config.sets}
            {isRest ? ' · отдых перед следующим подходом' : ''}
          </p>
          <p className="hint mt-1" aria-live="polite">
            {state.phase === 'finished'
              ? 'Все подходы выполнены.'
              : isRest
                ? 'Расслабьтесь и дышите спокойно.'
                : 'Дышите ровно, не задерживайте дыхание.'}
          </p>
        </div>

        {/* Set dots */}
        <div className="mt-6 flex flex-wrap justify-center gap-2" aria-hidden="true">
          {Array.from({ length: state.config.sets }, (_, index) => {
            const done = index < state.completedSets;
            const active = index === state.completedSets && state.phase !== 'finished';
            return (
              <span
                key={index}
                className={`h-3 w-8 rounded-full ${
                  done
                    ? 'bg-teal-400'
                    : active
                      ? 'bg-gold-400'
                      : 'bg-ink-700'
                }`}
              />
            );
          })}
        </div>

        {/* Large controls */}
        <div className="mt-8 grid grid-cols-2 gap-3">
          <Button
            variant={state.running ? 'secondary' : 'primary'}
            size="lg"
            className="col-span-2"
            onClick={() => (state.running ? pauseTimer() : startTimer())}
            aria-label={state.running ? 'Пауза' : state.phase === 'idle' ? 'Начать' : 'Продолжить'}
          >
            {state.running ? <IconPause className="h-6 w-6" /> : <IconPlay className="h-6 w-6" />}
            {state.running ? 'Пауза' : state.phase === 'idle' ? 'Начать' : 'Продолжить'}
          </Button>
          <Button variant="secondary" size="lg" onClick={skipToNextSet} disabled={state.phase === 'finished'}>
            <IconNext className="h-5 w-5" />
            Следующий подход
          </Button>
          <Button variant="ghost" size="lg" onClick={resetTimer}>
            <IconReset className="h-5 w-5" />
            Сброс
          </Button>
        </div>

        <p className="hint mt-4">
          {wakeLockSupported
            ? wakeLockActive
              ? 'Экран не погаснет, пока идёт отсчёт.'
              : 'Экран может погаснуть — нажмите «Начать», чтобы включить поддержку экрана.'
            : 'Этот браузер не поддерживает блокировку сна экрана. Таймер работает как обычно.'}
        </p>
      </Card>

      <Card className="card-pad">
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Настройки таймера</CardTitle>
          <Button variant="ghost" onClick={() => setShowSettings((value) => !value)}>
            {showSettings ? 'Скрыть' : 'Изменить'}
          </Button>
        </div>

        {showSettings ? (
          <div className="mt-4 space-y-4">
            <Stepper
              label="Длительность удержания"
              value={timerPrefs.holdSeconds}
              min={3}
              max={180}
              step={1}
              unit="секунд"
              onChange={(next) => {
                void patchPrefs({ holdSeconds: next });
                changeConfig({ holdSeconds: next, sets: timerPrefs.sets, restSeconds: timerPrefs.restSeconds });
              }}
            />
            <Stepper
              label="Число подходов"
              value={timerPrefs.sets}
              min={1}
              max={12}
              unit="подх."
              onChange={(next) => {
                void patchPrefs({ sets: next });
                changeConfig({ holdSeconds: timerPrefs.holdSeconds, sets: next, restSeconds: timerPrefs.restSeconds });
              }}
            />
            <Stepper
              label="Отдых между подходами"
              value={timerPrefs.restSeconds}
              min={0}
              max={180}
              step={5}
              unit="секунд"
              onChange={(next) => {
                void patchPrefs({ restSeconds: next });
                changeConfig({ holdSeconds: timerPrefs.holdSeconds, sets: timerPrefs.sets, restSeconds: next });
              }}
            />
            <div className="rounded-xl border border-ink-700 bg-ink-900/50 p-3">
              <Toggle
                label="Звуковой сигнал"
                description={
                  isAudioSupported()
                    ? 'Короткий сигнал в конце удержания и в конце отдыха.'
                    : 'В этом браузере звук недоступен — таймер будет работать без него.'
                }
                checked={timerPrefs.sound}
                onChange={(next) => void patchPrefs({ sound: next })}
              />
              <Toggle
                label="Вибрация"
                description={
                  isVibrationSupported()
                    ? 'Вибросигнал на мобильных устройствах.'
                    : 'Это устройство не поддерживает вибрацию.'
                }
                checked={timerPrefs.vibration}
                onChange={(next) => void patchPrefs({ vibration: next })}
              />
              <Toggle
                label="Не гасить экран"
                description={
                  wakeLockSupported
                    ? 'Используется Screen Wake Lock только во время отсчёта.'
                    : 'Браузер не поддерживает Screen Wake Lock. Ничего не сломается.'
                }
                checked={timerPrefs.wakeLock}
                onChange={(next) => void patchPrefs({ wakeLock: next })}
              />
            </div>
            <p className="hint">
              Рекомендуемые в источниках удержания для стабилизационных упражнений короткие — около
              8–15 секунд. Более длинные удержания согласуйте со специалистом.
            </p>
          </div>
        ) : (
          <p className="hint mt-2">
            {timerPrefs.holdSeconds} с · {timerPrefs.sets} подх. · отдых {timerPrefs.restSeconds} с
            {completedSets > 0 ? ` · завершено циклов: ${completedSets}` : ''}
          </p>
        )}
      </Card>

      <Card tone="warn" className="card-pad">
        <p className="text-sm leading-relaxed text-warn-100">
          Прекратите упражнение при усилении боли, распространении симптомов по ноге, нарастающем
          онемении или слабости, а также при головокружении. Таймер не отменяет эти правила.
        </p>
      </Card>
    </div>
  );
}
