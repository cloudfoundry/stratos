import { describe, it, expect, beforeEach } from 'vitest';
import { CapitalizeFirstPipe } from './capitalizeFirstLetter.pipe';

describe('CapitalizeFirstPipe', () => {
  let pipe: CapitalizeFirstPipe;

  beforeEach(() => {
    pipe = new CapitalizeFirstPipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return same value if !text', () => {
    // strict: the pipe is defensively null-safe by design (`if (!text) return text`);
    // its declared `string` param understates the runtime contract these cases verify.
    const transform = pipe.transform.bind(pipe) as (text: string | null | undefined) => string | null | undefined;
    expect(transform('')).toBe('');
    expect(transform(null)).toBe(null);
    expect(transform(undefined)).toBe(undefined);
  });

  it('should return first capitalized string', () => {
    expect(pipe.transform('text')).toBe('Text');
    expect(pipe.transform('teXt')).toBe('TeXt');
    expect(pipe.transform('tEXT')).toBe('TEXT');
  });
});
