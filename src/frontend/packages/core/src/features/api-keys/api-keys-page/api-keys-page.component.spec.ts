import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { timeOfDay } from '../../../shared/signal-list-configs/apiKeys/api-keys-signal-config.service';
import { TailwindDialogService } from '../../../shared/services/tailwind-dialog.service';
import { CreateApiKeyStepperComponent } from '../create-api-key-stepper/create-api-key-stepper.component';
import { ApiKeysPageComponent } from './api-keys-page.component';

// Local noon: the calendar-day wording reads the viewer's zone.
const NOW = new Date(2026, 9, 28, 12, 0, 0);
const DAY = 24 * 60 * 60 * 1000;
const inDays = (days: number) => new Date(NOW.getTime() + days * DAY);

describe('ApiKeysPageComponent', () => {
  let component: ApiKeysPageComponent;
  let fixture: ComponentFixture<ApiKeysPageComponent>;

  const mockDialogService = {
    open: vi.fn(),
  };

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    mockDialogService.open.mockReset();
    await TestBed.configureTestingModule({
      imports: [ApiKeysPageComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: TailwindDialogService, useValue: mockDialogService },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ApiKeysPageComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => vi.useRealTimers());

  async function listKeys(keys: object[]) {
    TestBed.inject(HttpTestingController).expectOne('/pp/v1/api_keys').flush(keys);
    await fixture.whenStable();
  }
  const key = (comment: string, expiresInDays: number | null) => ({
    guid: comment, comment, user_guid: 'u', last_used: null, last_used_refused: false,
    expires_at: expiresInDays === null ? null : inDays(expiresInDays).toISOString(),
  });
  const banners = () => Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('[data-testid="key-banner"]'));
  const norm = (el: Element) => el.textContent!.replace(/\s+/g, ' ').trim();

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('opens the create stepper with the dialog padding', async () => {
    mockDialogService.open.mockReturnValue({ afterClosed: () => of(undefined) });
    await component.addApiKey();

    const [type, config] = mockDialogService.open.mock.calls.at(-1)!;
    expect(type).toBe(CreateApiKeyStepperComponent);
    expect(config.panelClass).toContain('p-6');
    expect(config.disableClose).toBe(true);
  });

  it('never renders a New API Key card', async () => {
    await listKeys([key('tool', null)]);
    expect(fixture.nativeElement.textContent).not.toContain('New API Key');
    expect(fixture.nativeElement.querySelector('#apikey-secret')).toBeNull();
  });

  it('warns a day ahead, with the time', async () => {
    await listKeys([key('tool', 20 / 24)]);
    expect(banners().length).toBe(1);
    const at = timeOfDay(inDays(20 / 24));
    expect(norm(banners()[0])).toContain(
      `"tool" expires tomorrow at ${at}. Create a replacement and update the script that uses it.`);
    expect(banners()[0].className).not.toContain('danger');
  });

  it('names today or tomorrow by the local date', async () => {
    const at = (day: number, hour: number) => new Date(2026, 9, day, hour).toISOString();
    const cases: [number, number, string][] = [[9, 28 * 100 + 15, 'expires today at'], [22, 29 * 100 + 1, 'expires tomorrow at']];
    for (const [seen, packed, words] of cases) {
      vi.setSystemTime(new Date(2026, 9, 28, seen));
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ApiKeysPageComponent],
        providers: [provideZonelessChangeDetection(), provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
          provideNoopAnimations(), { provide: TailwindDialogService, useValue: mockDialogService }],
      }).compileComponents();
      fixture = TestBed.createComponent(ApiKeysPageComponent);
      await listKeys([{ ...key('k', null), expires_at: at(Math.floor(packed / 100), packed % 100) }]);
      expect(norm(banners()[0])).toContain(`"k" ${words}`);
    }
  });

  it('counts calendar days since expiry', async () => {
    vi.setSystemTime(new Date(2026, 9, 28, 8));
    await listKeys([{ ...key('k', null), expires_at: new Date(2026, 9, 27, 22).toISOString() }]);
    expect(norm(banners()[0])).toContain('"k" expired 1 day ago at');
  });

  it('shows no banner for a key with days to go', async () => {
    await listKeys([key('tool', 5), key('forever', null)]);
    expect(banners().length).toBe(0);
  });

  it('refuses in red for up to 7 days after expiry', async () => {
    await listKeys([key('tool', -3)]);
    expect(banners().length).toBe(1);
    expect(norm(banners()[0])).toContain(
      `"tool" expired 3 days ago at ${timeOfDay(inDays(-3))}. Requests that use it are refused.`);
    expect(banners()[0].className).toContain('danger');
  });

  it('says today for a key that expired today', async () => {
    await listKeys([key('tool', -0.1)]);
    expect(norm(banners()[0])).toContain('"tool" expired today at');
  });

  it('drops the banner after 7 days, but keeps the row', async () => {
    await listKeys([key('tool', -8)]);
    expect(banners().length).toBe(0);
    expect(fixture.nativeElement.querySelector('app-signal-list')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('tool');
  });

  it('Create replacement opens the stepper with the description', async () => {
    mockDialogService.open.mockReturnValue({ afterClosed: () => of(undefined) });
    await listKeys([key('deploy script', -1)]);
    const button = banners()[0].querySelector('button') as HTMLButtonElement;
    expect(button.textContent).toContain('Create replacement');
    button.click();

    const [type, config] = mockDialogService.open.mock.calls.at(-1)!;
    expect(type).toBe(CreateApiKeyStepperComponent);
    expect(config.data).toEqual({ comment: 'deploy script' });
  });
});
