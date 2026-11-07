import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TailwindSnackBarService } from '@stratosui/core';

import { APPLICATION_CLI_COMMANDS, commandsForTab } from '../cli-info/cli-commands';
import { CFAppCLIInfoContext } from '../cli-info/cli-info.component';
import { CliMenuComponent } from './cli-menu.component';

const context: CFAppCLIInfoContext = {
  appName: 'my app',
  spaceName: 'my space',
  orgName: 'my org',
  apiEndpoint: 'https://api.example.com',
  username: 'me',
  skipSslValidation: false,
  ssoAllowed: false,
};

describe('CliMenuComponent (#6126)', () => {
  let fixture: ComponentFixture<CliMenuComponent>;
  let writeText: ReturnType<typeof vi.fn>;
  let snackBar: { show: ReturnType<typeof vi.fn> };
  let originalClipboard: Clipboard;

  const el = () => fixture.nativeElement as HTMLElement;
  const trigger = () => el().querySelector('button[aria-label="CF CLI"]') as HTMLButtonElement;
  const items = () => Array.from(el().querySelectorAll('[role="menuitem"]')) as HTMLElement[];
  const labels = () => items().map(i => i.querySelector('.cli-menu__label')?.textContent?.trim());

  async function render(tab: string) {
    fixture = TestBed.createComponent(CliMenuComponent);
    fixture.componentRef.setInput('commands', commandsForTab(APPLICATION_CLI_COMMANDS, tab));
    fixture.componentRef.setInput('context', context);
    fixture.componentRef.setInput('allLink', ['/applications', 'cf1', 'app1', 'cli']);
    await fixture.whenStable();
  }

  async function open() {
    trigger().click();
    await fixture.whenStable();
  }

  beforeEach(() => {
    writeText = vi.fn().mockResolvedValue(undefined);
    originalClipboard = navigator.clipboard;
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    snackBar = { show: vi.fn() };
    TestBed.configureTestingModule({
      imports: [CliMenuComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: TailwindSnackBarService, useValue: snackBar },
      ],
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'clipboard', { value: originalClipboard, configurable: true });
  });

  it('is a closed menu button named CF CLI', async () => {
    await render('variables');
    expect(trigger()).toBeTruthy();
    expect(trigger().getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(el().querySelector('[role="menu"]')).toBeNull();
  });

  it('opens to the tab\'s commands with the names filled in, and CF CLI All last', async () => {
    await render('variables');
    await open();
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(labels()).toEqual([
      'cf env "my app"',
      'cf set-env "my app" [name] [value]',
      'cf unset-env "my app" [name]',
      'CF CLI All',
    ]);
  });

  it('copies a command when it is chosen, says so, and closes', async () => {
    await render('variables');
    await open();
    items()[0].click();
    await fixture.whenStable();
    expect(writeText).toHaveBeenCalledWith('cf env "my app"');
    expect(snackBar.show).toHaveBeenCalledWith('Copied cf env "my app"', 'Close');
    expect(el().querySelector('[role="menu"]')).toBeNull();
  });

  it('offers only CF CLI All on a tab with no CLI equivalent', async () => {
    await render('metrics');
    await open();
    expect(labels()).toEqual(['CF CLI All']);
  });

  it('links CF CLI All to the level\'s page', async () => {
    await render('summary');
    await open();
    const all = items().at(-1) as HTMLAnchorElement;
    const router = TestBed.inject(Router);
    expect(all.getAttribute('href')).toBe(router.serializeUrl(router.createUrlTree(['/applications', 'cf1', 'app1', 'cli'])));
  });

  it('closes on Escape', async () => {
    await render('summary');
    await open();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    expect(el().querySelector('[role="menu"]')).toBeNull();
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
  });

  it('closes on a click outside it', async () => {
    await render('summary');
    await open();
    document.body.click();
    await fixture.whenStable();
    expect(el().querySelector('[role="menu"]')).toBeNull();
  });
});
