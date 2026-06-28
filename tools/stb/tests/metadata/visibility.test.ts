import { describe, it, expect } from 'vitest';
import { nodeVisibility } from '../../src/metadata/visibility';

describe('nodeVisibility', () => {
  it('defaults missing visibility to shown', () => {
    expect(nodeVisibility({ visibility: undefined })).toBe(true);
  });
  it('returns explicit visibility', () => {
    expect(nodeVisibility({ visibility: false })).toBe(false);
    expect(nodeVisibility({ visibility: true })).toBe(true);
  });
});
