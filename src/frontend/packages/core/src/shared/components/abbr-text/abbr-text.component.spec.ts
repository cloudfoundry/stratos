import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { AbbrTextComponent } from './abbr-text.component';

// WCAG 3.1.4: an abbreviation has its expansion on the page. A label such
// as "SSH Access" marks the abbreviation with <abbr title>, which screen
// readers can read and a pointer shows.
describe('AbbrTextComponent', () => {
  let fixture: ComponentFixture<AbbrTextComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()], imports: [AbbrTextComponent] });
    fixture = TestBed.createComponent(AbbrTextComponent);
  });

  async function render(text: string): Promise<HTMLElement> {
    fixture.componentRef.setInput('text', text);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('marks a known abbreviation with its expansion and keeps the text', async () => {
    const el = await render('SSH Access');
    expect(el.textContent?.replace(/\s+/g, ' ').trim()).toBe('SSH Access');
    const abbr = el.querySelector('abbr');
    expect(abbr?.textContent).toBe('SSH');
    expect(abbr?.getAttribute('title')).toBe('Secure Shell');
  });

  it('marks each abbreviation in a label', async () => {
    const el = await render('CF/Org/Space');
    expect([...el.querySelectorAll('abbr')].map(a => a.textContent)).toEqual(['CF']);
    expect(el.textContent).toBe('CF/Org/Space');
  });

  it('leaves text with no known abbreviation as it is', async () => {
    const el = await render('Application Name');
    expect(el.querySelector('abbr')).toBeNull();
    expect(el.textContent).toBe('Application Name');
  });
});
