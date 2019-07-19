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
    expect(pipe.transform('')).toBe('');
    expect(pipe.transform(null)).toBe(null);
    expect(pipe.transform(undefined)).toBe(undefined);
  });

  it('should return first capitalized string', () => {
    expect(pipe.transform('text')).toBe('Text');
    expect(pipe.transform('teXt')).toBe('TeXt');
    expect(pipe.transform('tEXT')).toBe('TEXT');
  });
});
