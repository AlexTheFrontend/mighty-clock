import { useEffect, useState } from 'react';
import { CONFIG, computeTotals, projectBreakEven } from './lib/calculations';
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

export default function App() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const t = computeTotals(now);
  const projection = projectBreakEven(now, t);
  const netPositive = t.net >= 0;
  const progressPct = Math.round(t.progress * 100);

  return (
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
          label={`Petrol (${t.weeks} weeks × $8)`}
          amount={-t.petrol}
          sign="−"
        />
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
