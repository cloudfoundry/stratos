import { describe, it, expect, beforeEach } from 'vitest';
import { ApplicationStateIconPipe } from './application-state-icon.pipe';

describe('ApplicationStateIconPipe', () => {
  let pipe: ApplicationStateIconPipe;

  beforeEach(() => {
    pipe = new ApplicationStateIconPipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty if no value', () => {
    // strict: the pipe is defensively null-safe by design (`if (!value) return ''`);
    // its declared `string` param understates the runtime contract this case verifies.
    const transform = pipe.transform.bind(pipe) as (value: string | null, args?: string) => string;
    expect(transform(null, 'class')).toBe('');
  });

  it('should return css class', () => {
    expect(pipe.transform('tentative', 'class')).toBe('text-tentative');
  });

  it('should return icon name', () => {
    expect(pipe.transform('tentative', 'icon')).toBe('lens');
  });

  it('names each state for assistive technology', () => {
    expect(pipe.transform('STARTED', 'label')).toBe('Started');
    expect(pipe.transform('STOPPED', 'label')).toBe('Stopped');
    expect(pipe.transform('ok', 'label')).toBe('OK');
    expect(pipe.transform('tentative', 'label')).toBe('Tentative');
    expect(pipe.transform('incomplete', 'label')).toBe('Incomplete');
    expect(pipe.transform('warning', 'label')).toBe('Warning');
    expect(pipe.transform('error', 'label')).toBe('Error');
    expect(pipe.transform('deleted', 'label')).toBe('Deleted');
    expect(pipe.transform('busy', 'label')).toBe('Busy');
  });

  it('should return empty if not a valid status', () => {
    expect(pipe.transform('invalid')).toBe('');
  });
});
