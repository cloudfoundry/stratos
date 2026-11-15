import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { StratosBrandingService, ThemeMode } from '../../../../../theme/stratos-branding.service';
import { ThemeToggleComponent } from './theme-toggle.component';

// WCAG 2.5.3 Label in Name: the accessible name of the button holds the
// text the button shows, so a speech user can say what they see.
describe('ThemeToggleComponent', () => {
  async function setup(mode: ThemeMode, dark: boolean) {
    const isDarkMode = signal(dark);
    const branding = { themeMode: signal(mode), isDarkMode, toggleTheme: () => isDarkMode.update((d) => !d), setThemeMode: () => {} };
    TestBed.configureTestingModule({
      imports: [ThemeToggleComponent],
      providers: [provideZonelessChangeDetection(), { provide: StratosBrandingService, useValue: branding }],
    });
    const fixture = TestBed.createComponent(ThemeToggleComponent);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    const shown = (fixture.nativeElement.querySelector('.theme-label') as HTMLElement).textContent!.trim();
    const status = fixture.nativeElement.querySelector('[role="status"]') as HTMLElement;
    return { fixture, button, shown, status };
  }

  for (const [mode, dark, shown, next] of [
    ['light', false, 'Light', 'dark'],
    ['dark', true, 'Dark', 'light'],
    ['system', true, 'System', 'light'],
    ['system', false, 'System', 'dark'],
  ] as const) {
    it(`names the ${mode} (${dark ? 'dark' : 'light'}) button with the text it shows`, async () => {
      const { button, shown: text } = await setup(mode, dark);
      expect(text).toBe(shown);
      const name = button.getAttribute('aria-label')!;
      expect(name.startsWith(text)).toBe(true);
      expect(name).toContain(`switch to ${next} mode`);
    });
  }

  it('says the state in the name, not with aria-pressed', async () => {
    const { button } = await setup('dark', true);
    expect(button.hasAttribute('aria-pressed')).toBe(false);
  });

  // The toggle is in every page header, so it is drawn on each page
  // change. A status region that already holds the mode put "Dark mode
  // activated" in the page each time (WCAG 4.1.3: a message with no
  // change behind it). It speaks only after a press.
  it('says nothing when it is drawn', async () => {
    const { status } = await setup('dark', true);
    expect(status.textContent!.trim()).toBe('');
  });

  it('says the new mode after a press', async () => {
    const { fixture, button, status } = await setup('dark', true);
    button.click();
    await fixture.whenStable();
    expect(status.textContent!.trim()).toBe('Light mode activated');
  });
});
