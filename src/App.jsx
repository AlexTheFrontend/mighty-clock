import { useEffect, useState } from 'react';
import {
  CONFIG,
  breakdownDuration,
  computeTotals,
  projectBreakEven,
} from './lib/calculations';
import './App.css';

const nzd = new Intl.NumberFormat('en-NZ', {
  style: 'currency',
  currency: 'NZD',
  maximumFractionDigits: 2,
});

const dateLong = new Intl.DateTimeFormat('en-NZ', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const time = new Intl.DateTimeFormat('en-NZ', {
  hour: '2-digit',
  minute: '2-digit',
});

const THEME_KEY = 'mighty-clock-theme';

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light';
  return window.localStorage.getItem(THEME_KEY) || 'light';
}

export default function App() {
  const [now, setNow] = useState(() => new Date());
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  const t = computeTotals(now);
  const projection = projectBreakEven(now, t);
  const timeSaved = breakdownDuration(t.timeSavedMinutes);
  const netPositive = t.net >= 0;
  const progressPct = Math.round(t.progress * 100);

  return (
    <>
      <button
        type="button"
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
      <main className="card">
        <h1>Saved on parking in the city</h1>

      <div className={`net ${netPositive ? 'positive' : 'negative'}`}>
        {nzd.format(t.net)}
      </div>
      <p className="subtitle">net of all motorbike costs</p>

      <section className="projection">
        {netPositive ? (
          <>
            <span className="projection-label">Broken even</span>
            <span className="projection-value">on {dateLong.format(now)}</span>
          </>
        ) : projection.converged ? (
          <>
            <span className="projection-label">Projected break-even</span>
            <span className="projection-value">
              {dateLong.format(projection.date)}
            </span>
            <span className="projection-meta">
              in {projection.daysFromNow.toLocaleString('en-NZ')} days
            </span>
          </>
        ) : (
          <>
            <span className="projection-label">Projected break-even</span>
            <span className="projection-value">never — costs outpace savings</span>
          </>
        )}
      </section>

      <section className="time-saved">
        <span className="projection-label">Time saved</span>
        <div className="time-grid">
          <TimeUnit value={timeSaved.months} label="months" />
          <TimeUnit value={timeSaved.weeks} label="weeks" />
          <TimeUnit value={timeSaved.days} label="days" />
          <TimeUnit value={timeSaved.hours} label="hours" />
          <TimeUnit value={timeSaved.minutes} label="minutes" />
        </div>
        <span className="projection-meta">
          {t.parkingDays.toLocaleString('en-NZ')} commutes × 1 h 20 min
        </span>
      </section>

      <section className="progress">
        <div className="progress-label">
          <span>Break-even progress</span>
          <span>{progressPct}%</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${Math.min(100, progressPct)}%` }}
          />
        </div>
      </section>

      <section className="breakdown">
        <Row
          label={`Parking saved (${t.parkingDays} Tue/Wed/Thu days)`}
          amount={t.parkingSavings}
          sign="+"
        />
        <Row label="Motorbike" amount={-t.motorbike} sign="−" />
        <Row
          label={`Registration (${t.regoCount} × $460)`}
          amount={-t.rego}
          sign="−"
        />
        <Row
          label={`Service (${t.serviceCount} × $100)`}
          amount={-t.service}
          sign="−"
        />
        <Row label={`WOF (${t.wofCount} × $60)`} amount={-t.wof} sign="−" />
        <hr />
        <Row label="Net" amount={t.net} sign="" isTotal />
      </section>

        <footer>
          Started {dateLong.format(CONFIG.startDate)} · Day {t.daysElapsed} ·
          Updated {time.format(now)}
        </footer>
      </main>
    </>
  );
}

function TimeUnit({ value, label }) {
  return (
    <div className="time-unit">
      <span className="time-unit-value">{value}</span>
      <span className="time-unit-label">{label}</span>
    </div>
  );
}

function Row({ label, amount, sign, isTotal }) {
  const cls = ['row'];
  if (isTotal) cls.push('row-total');
  if (amount < 0) cls.push('row-negative');
  if (amount > 0 && sign === '+') cls.push('row-positive');
  return (
    <div className={cls.join(' ')}>
      <span className="row-label">
        <span className="row-sign">{sign}</span>
        {label}
      </span>
      <span className="row-amount">{nzd.format(amount)}</span>
    </div>
  );
}
