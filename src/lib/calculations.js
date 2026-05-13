export const CONFIG = {
  startDate: new Date(2026, 3, 13),
  parkingRate: 16.5,
  parkingDays: [2, 3, 4],
  motorbikeCost: 4400,
  petrolPerWeek: 8,
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

export function countWeeksElapsed(start, end) {
  const days = Math.floor((atMidnight(end) - atMidnight(start)) / MS_PER_DAY);
  return Math.max(0, Math.floor(days / 7));
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

  const start = atMidnight(CONFIG.startDate);
  const todayMid = atMidnight(today);
  let daysSinceStart = Math.floor((todayMid - start) / MS_PER_DAY);

  const cursor = new Date(todayMid);
  for (let i = 1; i <= MAX_DAYS; i++) {
    cursor.setDate(cursor.getDate() + 1);
    daysSinceStart++;

    if (CONFIG.parkingDays.includes(cursor.getDay())) {
      net += CONFIG.parkingRate;
    }
    if (daysSinceStart > 0 && daysSinceStart % 7 === 0) {
      net -= CONFIG.petrolPerWeek;
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

  const parkingDays = countParkingDays(start, today);
  const parkingSavings = parkingDays * CONFIG.parkingRate;

  const weeks = countWeeksElapsed(start, today);
  const petrol = weeks * CONFIG.petrolPerWeek;

  const regoCount = countAnniversaries(CONFIG.registration.firstDate, today);
  const rego = regoCount * CONFIG.registration.amount;

  const serviceCount = countAnniversaries(CONFIG.service.firstDate, today);
  const service = serviceCount * CONFIG.service.amount;

  const wofCount = countAnniversaries(CONFIG.wof.firstDate, today);
  const wof = wofCount * CONFIG.wof.amount;

  const totalCost = CONFIG.motorbikeCost + petrol + rego + service + wof;
  const net = parkingSavings - totalCost;

  const daysElapsed = Math.max(1, daysBetweenInclusive(start, today));
  const progress = Math.max(0, Math.min(1, parkingSavings / totalCost));

  return {
    parkingDays,
    parkingSavings,
    motorbike: CONFIG.motorbikeCost,
    weeks,
    petrol,
    regoCount,
    rego,
    serviceCount,
    service,
    wofCount,
    wof,
    totalCost,
    net,
    daysElapsed,
    progress,
  };
}
