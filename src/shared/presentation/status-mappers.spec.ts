import {
  mapDeliverableStatus,
  mapProjectStatus,
  progressFromStatus,
} from './status-mappers';

describe('status mappers', () => {
  it.each([
    ['draft', 'draft'],
    ['planning', 'draft'],
    ['active', 'active'],
    ['in_review', 'active'],
    ['waiting_approval', 'paused'],
    ['on_hold', 'paused'],
    ['completed', 'completed'],
    ['cancelled', 'archived'],
  ])('maps project status %s to %s', (source, expected) => {
    expect(mapProjectStatus(source)).toBe(expected);
  });

  it.each([
    ['approved', 'done'],
    ['in_progress', 'in_progress'],
    ['in_review', 'in_progress'],
    ['rejected', 'blocked'],
    ['overdue', 'blocked'],
    ['todo', 'todo'],
  ])('maps deliverable status %s to %s', (source, expected) => {
    expect(mapDeliverableStatus(source)).toBe(expected);
  });

  it('maps known and fallback project progress values', () => {
    expect(progressFromStatus('waiting_approval')).toBe(78);
    expect(progressFromStatus('unknown')).toBe(25);
  });
});
