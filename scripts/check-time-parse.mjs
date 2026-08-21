// Round-trip check for the time-field parse/format logic in components/RoutineForm.tsx.
// Run: node scripts/check-time-parse.mjs
import assert from 'node:assert/strict';

function clockToParts(value) {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (!match) return { hh: '', mm: '', meridiem: 'am' };
  return {
    hh: String(parseInt(match[1], 10)),
    mm: match[2],
    meridiem: match[3].toLowerCase(),
  };
}

function minutesToParts(value) {
  const total = parseInt(value, 10);
  if (value === '' || Number.isNaN(total)) return { hh: '', mm: '' };
  return {
    hh: String(Math.min(12, Math.floor(total / 60))),
    mm: String(total % 60).padStart(2, '0'),
  };
}

function clampNumber(raw, min, max) {
  const parsed = parseInt(raw, 10);
  if (Number.isNaN(parsed)) return min;
  return Math.min(max, Math.max(min, parsed));
}

const emitClock = (hh, mm, meridiem) =>
  `${clampNumber(hh, 1, 12)}:${String(clampNumber(mm, 0, 59)).padStart(2, '0')} ${meridiem}`;

const emitDuration = (hh, mm) =>
  String(Math.min(12 * 60, clampNumber(hh || '0', 0, 12) * 60 + clampNumber(mm || '0', 0, 59)));

// Stored clock values survive a parse -> render -> emit cycle unchanged.
for (const stored of ['9:30 pm', '3:30 am', '12:00 am', '12:59 pm', '1:05 am']) {
  const p = clockToParts(stored);
  assert.equal(emitClock(p.hh, p.mm, p.meridiem), stored, `clock round-trip ${stored}`);
}

// Out-of-range typing is clamped, never invalid.
assert.equal(emitClock('99', '99', 'am'), '12:59 am');
assert.equal(emitClock('0', '7', 'pm'), '1:07 pm');

// Day rest: minutes <-> hr/min boxes round-trip and cap at 12h.
for (const stored of ['0', '90', '120', '719', '720']) {
  const p = minutesToParts(stored);
  assert.equal(emitDuration(p.hh, p.mm), stored, `duration round-trip ${stored}`);
}
assert.equal(emitDuration('20', '99'), '720');

console.log('time parse checks passed');
