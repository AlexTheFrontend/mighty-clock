export const CONFIG = {
  startDate: new Date(2026, 3, 13),
  parkingRate: 16.5,
  parkingDays: [2, 3, 4],
  minutesSavedPerDay: 80,
  motorbikeCost: 4400,
  registration: { amount: 460, firstDate: new Date(2026, 5, 9) },
  service: { amount: 100, firstDate: new Date(2026, 8, 1) },
  wof: { amount: 60, firstDate: new Date(2026, 11, 1) },
};

const MS_PER_DAY = 86_400_000;

function atMidnight(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysBetweenInclusive(start, end) {
  return Math.floor((atMidnight(end) - atMidnight(start)) / MS_PER_DAY) + 1;
}

export function countParkingDays(start, end) {
  const s = atMidnight(start);
  const e = atMidnight(end);
  if (e < s) return 0;
  let count = 0;
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    if (CONFIG.parkingDays.includes(d.getDay())) count++;
  }
  return count;
}

// First Friday of each month — counts the once-a-month bonus parking day.
export function isFirstFridayOfMonth(date) {
  return date.getDay() === 5 && date.getDate() <= 7;
}

export function countBonusFridays(start, end) {
  const s = atMidnight(start);
  const e = atMidnight(end);
  if (e < s) return 0;
  let count = 0;
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    if (isFirstFridayOfMonth(d)) count++;
  }
  return count;
}

export function countAnniversaries(firstDate, today) {
  const first = atMidnight(firstDate);
  const now = atMidnight(today);
  if (now < first) return 0;
  let count = 1;
  let next = new Date(first.getFullYear() + 1, first.getMonth(), first.getDate());
  while (next <= now) {
    count++;
    next = new Date(next.getFullYear() + 1, next.getMonth(), next.getDate());
  }
  return count;
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function projectBreakEven(today, totals) {
  if (totals.net >= 0) {
    return { date: atMidnight(today), daysFromNow: 0, converged: true };
  }

  const MAX_DAYS = 365 * 30;
  let net = totals.net;

  const nextAnniversary = (firstDate, count) =>
    new Date(
      firstDate.getFullYear() + count,
      firstDate.getMonth(),
      firstDate.getDate(),
    );

  let nextRego = nextAnniversary(CONFIG.registration.firstDate, totals.regoCount);
  let nextService = nextAnniversary(CONFIG.service.firstDate, totals.serviceCount);
  let nextWof = nextAnniversary(CONFIG.wof.firstDate, totals.wofCount);

  const todayMid = atMidnight(today);

  const cursor = new Date(todayMid);
  for (let i = 1; i <= MAX_DAYS; i++) {
    cursor.setDate(cursor.getDate() + 1);

    if (CONFIG.parkingDays.includes(cursor.getDay())) {
      net += CONFIG.parkingRate;
    } else if (isFirstFridayOfMonth(cursor)) {
      net += CONFIG.parkingRate;
    }
    if (sameDay(cursor, nextRego)) {
      net -= CONFIG.registration.amount;
      nextRego = nextAnniversary(nextRego, 1);
    }
    if (sameDay(cursor, nextService)) {
      net -= CONFIG.service.amount;
      nextService = nextAnniversary(nextService, 1);
    }
    if (sameDay(cursor, nextWof)) {
      net -= CONFIG.wof.amount;
      nextWof = nextAnniversary(nextWof, 1);
    }

    if (net >= 0) {
      return { date: new Date(cursor), daysFromNow: i, converged: true };
    }
  }

  return { date: null, daysFromNow: null, converged: false };
}

export function computeTotals(today = new Date()) {
  const start = CONFIG.startDate;

  const regularDays = countParkingDays(start, today);
  const bonusFridays = countBonusFridays(start, today);
  const parkingDays = regularDays + bonusFridays;
  const parkingSavings = parkingDays * CONFIG.parkingRate;

  const regoCount = countAnniversaries(CONFIG.registration.firstDate, today);
  const rego = regoCount * CONFIG.registration.amount;

  const serviceCount = countAnniversaries(CONFIG.service.firstDate, today);
  const service = serviceCount * CONFIG.service.amount;

  const wofCount = countAnniversaries(CONFIG.wof.firstDate, today);
  const wof = wofCount * CONFIG.wof.amount;

  const totalCost = CONFIG.motorbikeCost + rego + service + wof;
  const net = parkingSavings - totalCost;
  const timeSavedMinutes = parkingDays * CONFIG.minutesSavedPerDay;

  const daysElapsed = Math.max(1, daysBetweenInclusive(start, today));
  const progress = Math.max(0, Math.min(1, parkingSavings / totalCost));

  return {
    parkingDays,
    regularDays,
    bonusFridays,
    parkingSavings,
    motorbike: CONFIG.motorbikeCost,
    regoCount,
    rego,
    serviceCount,
    service,
    wofCount,
    wof,
    totalCost,
    net,
    timeSavedMinutes,
    daysElapsed,
    progress,
  };
}

export function breakdownDuration(totalMinutes) {
  const MINUTE = 1;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;
  const WEEK = 7 * DAY;
  const MONTH = 30 * DAY;

  const months = Math.floor(totalMinutes / MONTH);
  let rem = totalMinutes - months * MONTH;
  const weeks = Math.floor(rem / WEEK);
  rem = rem - weeks * WEEK;
  const days = Math.floor(rem / DAY);
  rem = rem - days * DAY;
  const hours = Math.floor(rem / HOUR);
  const minutes = rem - hours * HOUR;

  return { months, weeks, days, hours, minutes };
}
