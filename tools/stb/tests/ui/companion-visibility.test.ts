import { describe, it, expect } from 'vitest';
import { companionVisibilityId } from '@/ui/element-edit';

describe('companionVisibilityId', () => {
  it('inserts show- before the last segment', () => {
    expect(companionVisibilityId('auth.login.logo')).toBe('auth.login.show-logo');
    expect(companionVisibilityId('auth.login.title')).toBe('auth.login.show-title');
  });
});
