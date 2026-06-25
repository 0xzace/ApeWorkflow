import { describe, expect, it } from 'vitest';
import { parseChecklistItems } from '../../src/core/planning-files';

describe('parseChecklistItems with type extraction', () => {
  it('extracts type from "Type: feature — description" format', () => {
    const items = parseChecklistItems('- [ ] Type: feature — implement archive collision fix');
    expect(items).toEqual([{ description: 'implement archive collision fix', done: false, type: 'feature' }]);
  });

  it('extracts type with dash separator', () => {
    const items = parseChecklistItems('- [x] Type: bugfix - fix config defaults');
    expect(items).toEqual([{ description: 'fix config defaults', done: true, type: 'bugfix' }]);
  });

  it('works without type prefix (backward compatible)', () => {
    const items = parseChecklistItems('- [ ] implement archive collision fix');
    expect(items).toEqual([{ description: 'implement archive collision fix', done: false, type: undefined }]);
  });

  it('handles multiple items with mixed types', () => {
    const content = `- [ ] Type: refactor — clean up old logic
- [x] Type: docs — update config examples
- [ ] Add new feature`;
    const items = parseChecklistItems(content);
    expect(items).toHaveLength(3);
    expect(items[0].type).toBe('refactor');
    expect(items[1].type).toBe('docs');
    expect(items[2].type).toBeUndefined();
  });
});
