// frontend/src/utils/cron.test.mjs
import assert from 'node:assert';
import {
  formatCronToHuman,
  computeCronFromUserSelection,
  parseCronToUserSelection,
} from './cron.ts';

console.log('Running updated cron utility tests (Weekly & Monthly)...');

// 1. computeCronFromUserSelection
assert.strictEqual(computeCronFromUserSelection('weekly', '09:00', '1'), '0 9 * * 1');
assert.strictEqual(computeCronFromUserSelection('weekly', '18:30', '5'), '30 18 * * 5');
assert.strictEqual(computeCronFromUserSelection('monthly', '08:00', '1', '15'), '0 8 15 * *');
assert.strictEqual(computeCronFromUserSelection('monthly', '14:00', '1', '28'), '0 14 28 * *');

// 2. formatCronToHuman
assert.strictEqual(formatCronToHuman('0 9 * * 1'), 'Weekly on Mondays at 9:00 AM');
assert.strictEqual(formatCronToHuman('30 18 * * 5'), 'Weekly on Fridays at 6:30 PM');
assert.strictEqual(formatCronToHuman('0 8 15 * *'), 'Monthly on the 15th at 8:00 AM');
assert.strictEqual(formatCronToHuman('0 14 1 * *'), 'Monthly on the 1st at 2:00 PM');
assert.strictEqual(formatCronToHuman(null), 'Scheduled Pipeline Run');

// 3. parseCronToUserSelection
const p1 = parseCronToUserSelection('30 18 * * 5');
assert.strictEqual(p1.frequency, 'weekly');
assert.strictEqual(p1.time, '18:30');
assert.strictEqual(p1.dayOfWeek, '5');

const p2 = parseCronToUserSelection('0 8 15 * *');
assert.strictEqual(p2.frequency, 'monthly');
assert.strictEqual(p2.time, '08:00');
assert.strictEqual(p2.dayOfMonth, '15');

// Round-trip test
const cronWeekly = '0 9 * * 3';
const parsedWeekly = parseCronToUserSelection(cronWeekly);
const reconstructedWeekly = computeCronFromUserSelection(
  parsedWeekly.frequency,
  parsedWeekly.time,
  parsedWeekly.dayOfWeek,
  parsedWeekly.dayOfMonth
);
assert.strictEqual(reconstructedWeekly, cronWeekly);

const cronMonthly = '0 10 20 * *';
const parsedMonthly = parseCronToUserSelection(cronMonthly);
const reconstructedMonthly = computeCronFromUserSelection(
  parsedMonthly.frequency,
  parsedMonthly.time,
  parsedMonthly.dayOfWeek,
  parsedMonthly.dayOfMonth
);
assert.strictEqual(reconstructedMonthly, cronMonthly);

console.log('✅ All updated cron tests passed!');
