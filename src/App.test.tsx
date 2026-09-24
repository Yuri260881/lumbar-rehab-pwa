import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { AppProvider } from './hooks/useAppData';
import { RED_FLAGS_TITLE } from './data/content';

// The app talks to the Notification API only behind capability checks, but the
// tests should be explicit about the "no permission / unsupported" path.
beforeEach(() => {
  window.localStorage.clear();
  Object.defineProperty(window, 'Notification', {
    value: undefined,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(window.navigator, 'serviceWorker', {
    value: undefined,
    configurable: true,
    writable: true,
  });
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

function renderApp() {
  return render(
    <AppProvider>
      <App />
    </AppProvider>,
  );
}

describe('safety interlocks', () => {
  it('shows the medical warning before any exercise content', async () => {
    renderApp();
    expect(await screen.findByText(/не лечит грыжу/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /сегодняшняя программа/i })).not.toBeInTheDocument();
  });

  it('blocks starting until the warning is acknowledged', async () => {
    const user = userEvent.setup();
    renderApp();
    const continueButton = await screen.findByRole('button', { name: 'Продолжить' });
    expect(continueButton).toBeDisabled();

    await user.click(
      screen.getByLabelText(/я прочитал\(а\) предупреждение/i),
    );
    expect(continueButton).toBeEnabled();
  });

  it('does not offer exercises when a red flag is reported', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(await screen.findByLabelText(/я прочитал\(а\) предупреждение/i));
    await user.click(screen.getByLabelText(/потеря контроля над мочеиспусканием или кишечником/i));

    const blocked = await screen.findByRole('button', {
      name: /сохранить и продолжить к справочной информации/i,
    });
    await user.click(blocked);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(
      screen.getByText(/остановитесь и обратитесь за медицинской помощью/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /начать тренировку/i })).not.toBeInTheDocument();
  });

  it('keeps the red-flag reference list available', async () => {
    renderApp();
    await screen.findByText(/не лечит грыжу/i);
    // The full list is reachable from the guide page as well.
    expect(RED_FLAGS_TITLE).toMatch(/срочно обратиться/i);
  });
});

describe('dashboard after acceptance', () => {
  it('shows the program, the next reminder and the daily tip', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(await screen.findByLabelText(/я прочитал\(а\) предупреждение/i));
    await user.click(screen.getByRole('button', { name: 'Продолжить' }));

    expect(await screen.findByRole('heading', { name: /сегодняшняя программа/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /начать тренировку/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /рекомендация дня/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /предупреждения и ограничения/i })).toBeInTheDocument();
  });

  it('does not promise a cure anywhere on the dashboard', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(await screen.findByLabelText(/я прочитал\(а\) предупреждение/i));
    await user.click(screen.getByRole('button', { name: 'Продолжить' }));
    await screen.findByRole('heading', { name: /сегодняшняя программа/i });

    const text = document.body.textContent?.toLowerCase() ?? '';
    // Promissory wording must never appear as a claim.
    for (const phrase of ['вылечит грыжу', 'рассасывание грыжи', 'гарантированное лечение', 'полное устранение']) {
      expect(text, `promissory phrase: ${phrase}`).not.toContain(phrase);
    }
    // The negated form is required — the app must state what it does NOT do.
    expect(text).toContain('не обещает');
  });
});

describe('exercise library', () => {
  it('cites a source with an access date on the exercise card', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(await screen.findByLabelText(/я прочитал\(а\) предупреждение/i));
    await user.click(screen.getByRole('button', { name: 'Продолжить' }));
    await user.click(await screen.findByRole('button', { name: /библиотека/i }));

    const sources = await screen.findAllByRole('button', { name: /техника и источник/i });
    await user.click(sources[0]);

    expect(await screen.findByRole('heading', { name: 'Источник' })).toBeInTheDocument();
    const card = screen.getAllByRole('heading', { name: 'Источник' })[0]
      .closest('section') as HTMLElement;
    expect(within(card).getAllByText(/дата проверки источника/i).length).toBeGreaterThan(0);
    await waitFor(() => expect(within(card).getAllByRole('link').length).toBeGreaterThan(0));
  });
});
