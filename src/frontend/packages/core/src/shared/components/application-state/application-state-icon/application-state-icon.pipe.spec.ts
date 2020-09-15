import { ApplicationStateIconPipe } from './application-state-icon.pipe';

describe('ApplicationStateIconPipe', () => {
  let pipe;

  beforeEach(() => {
    pipe = new ApplicationStateIconPipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty if no value', () => {
    expect(pipe.transform(null, 'class')).toBe('');
  });

  it('should return css class', () => {
    expect(pipe.transform('tentative', 'class')).toBe('text-tentative');
  });

  it('should return icon name', () => {
    expect(pipe.transform('tentative', 'icon')).toBe('lens');
  });

  it('should return empty if not a valid status', () => {
    expect(pipe.transform('invalid')).toBe('');
  });
});
