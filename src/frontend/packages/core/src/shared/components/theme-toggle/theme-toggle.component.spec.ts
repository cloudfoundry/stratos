import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { StratosBrandingService, ThemeMode } from '../../../../../theme/stratos-branding.service';
import { ThemeToggleComponent } from './theme-toggle.component';

// WCAG 2.5.3 Label in Name: the accessible name of the button holds the
// text the button shows, so a speech user can say what they see.
describe('ThemeToggleComponent', () => {
  async function setup(mode: ThemeMode, dark: boolean) {
    const branding = { themeMode: signal(mode), isDarkMode: signal(dark), toggleTheme: () => {}, setThemeMode: () => {} };
    TestBed.configureTestingModule({
      imports: [ThemeToggleComponent],
      providers: [provideZonelessChangeDetection(), { provide: StratosBrandingService, useValue: branding }],
    });
    const fixture = TestBed.createComponent(ThemeToggleComponent);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    const shown = (fixture.nativeElement.querySelector('.theme-label') as HTMLElement).textContent!.trim();
    return { button, shown };
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
});
