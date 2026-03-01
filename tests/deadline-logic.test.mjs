import test from 'node:test';
import assert from 'node:assert/strict';
import { getDeadlineStatus, parseFlexibleDate } from '../lib/core/deadlineLogic.ts';

test('parseFlexibleDate handles ISO dates', () => {
  const parsed = parseFlexibleDate('2026-11-24');
  assert.equal(parsed.toISOString().slice(0, 10), '2026-11-24');
});

test('parseFlexibleDate handles short academic-style dates', () => {
  const parsed = parseFlexibleDate('Mon. Nov. 24 @ 9:00am');
  assert.equal(parsed.getMonth(), 10);
  assert.equal(parsed.getDate(), 24);
});

test('getDeadlineStatus returns next upcoming deadline when present', () => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + 7);

  const result = getDeadlineStatus([
    { dueDate: nextWeek.toISOString() },
    { dueDate: tomorrow.toISOString() },
  ]);

  assert.equal(result.hasUpcoming, true);
  assert.equal(result.isFinished, false);
  assert.equal(result.nextDeadline?.dueDate, tomorrow.toISOString());
});

test('getDeadlineStatus marks past-only deadlines as finished', () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const result = getDeadlineStatus([{ dueDate: yesterday.toISOString() }]);

  assert.equal(result.hasUpcoming, false);
  assert.equal(result.isFinished, true);
  assert.equal(result.closestDeadline?.dueDate, yesterday.toISOString());
});
