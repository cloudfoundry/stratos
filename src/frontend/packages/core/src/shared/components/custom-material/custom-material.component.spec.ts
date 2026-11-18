import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CustomIconComponent } from './custom-material.component';

describe('CustomIconComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  const render = async (inputs: Record<string, unknown> = {}) => {
    const fixture = TestBed.createComponent(CustomIconComponent);
    Object.entries(inputs).forEach(([name, value]) => fixture.componentRef.setInput(name, value));
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  };

  // The stylesheet sizes an inline icon from the text around it through this
  // class on the host. Unit tests have no cascade, so the sizes are checked live.
  it('marks its host when inline', async () => {
    const host = await render({ inline: true });
    expect(host.classList).toContain('custom-icon-inline');
    expect(host.querySelector('i')!.classList).toContain('inline');
  });

  it('leaves the host unmarked by default', async () => {
    const host = await render();
    expect(host.classList).not.toContain('custom-icon-inline');
  });

  // The glyph is a ligature: without this a screen reader reads "mode_edit"
  // into the name of whatever holds the icon.
  it('hides itself from assistive technology unless it is given a label', async () => {
    const plain = await render();
    expect(plain.getAttribute('aria-hidden')).toBe('true');
    expect(plain.querySelector('i')!.hasAttribute('role')).toBe(false);

    const labelled = await render({ ariaLabel: 'Warning' });
    expect(labelled.hasAttribute('aria-hidden')).toBe(false);
    expect(labelled.querySelector('i')!.getAttribute('role')).toBe('img');
    expect(labelled.querySelector('i')!.getAttribute('aria-label')).toBe('Warning');
  });

  it('draws the glyph in the font it is given', async () => {
    const host = await render({ fontSet: 'stratos-icons' });
    expect(host.querySelector('i')!.classList).toContain('stratos-icons');
  });
});
