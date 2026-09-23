const TZ = 'Asia/Bangkok';

export function nowInBangkok(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: TZ }));
}

export function formatBangkokDate(date: Date): string {
  return date.toLocaleDateString('th-TH', {
    timeZone: TZ,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatBangkokTime(date: Date): string {
  return date.toLocaleTimeString('th-TH', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function toBangkokISOString(date: Date): string {
  const offset = '+07:00';
  const utcMs = date.getTime();
  const bangkokMs = utcMs + 7 * 60 * 60 * 1000;
  const d = new Date(bangkokMs);
  return d.toISOString().replace('Z', offset);
}

export function isWithinHours(date: Date, hours: number): boolean {
  const nowMs = Date.now();
  const diffMs = nowMs - date.getTime();
  return diffMs >= 0 && diffMs <= hours * 60 * 60 * 1000;
}
