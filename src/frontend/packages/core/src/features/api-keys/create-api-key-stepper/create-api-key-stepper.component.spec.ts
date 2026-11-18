import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { BASE_TEST_PROVIDERS } from '@test-framework/core-test.helper';
import { MAT_DIALOG_DATA, TailwindDialogRef } from '../../../shared/services/tailwind-dialog.service';
import { ApiKeysDataService } from '../api-keys-data.service';
import { CreateApiKeyStepperComponent } from './create-api-key-stepper.component';

const NOW = new Date('2026-10-28T12:00:00Z');

describe('CreateApiKeyStepperComponent', () => {
  let fixture: ComponentFixture<CreateApiKeyStepperComponent>;
  let create: ReturnType<typeof vi.fn>;
  let close: ReturnType<typeof vi.fn>;
  let data: { comment?: string };

  beforeEach(() => {
    // Only Date is faked: timers and promises stay real for the stepper.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    data = {};
    create = vi.fn().mockResolvedValue({ guid: 'g', comment: 'CI', secret: 'the-secret' });
    close = vi.fn();
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, CreateApiKeyStepperComponent],
      providers: [
        ...BASE_TEST_PROVIDERS,
        provideZonelessChangeDetection(),
        { provide: ApiKeysDataService, useValue: { create } },
        { provide: TailwindDialogRef, useValue: { close } },
        { provide: MAT_DIALOG_DATA, useFactory: () => data },
      ],
    });
  });

  afterEach(() => vi.useRealTimers());

  async function open() {
    fixture = TestBed.createComponent(CreateApiKeyStepperComponent);
    await fixture.whenStable();
  }
  const q = <T extends HTMLElement>(sel: string) => (fixture.nativeElement as HTMLElement).querySelector<T>(sel);
  const text = () => (fixture.nativeElement as HTMLElement).textContent!.replace(/\s+/g, ' ');

  async function type(sel: string, value: string, event = 'input') {
    const el = q<HTMLInputElement | HTMLSelectElement>(sel)!;
    el.value = value;
    el.dispatchEvent(new Event(event, { bubbles: true }));
    await fixture.whenStable();
  }
  async function clickNext() {
    q<HTMLButtonElement>('#stepper_next')!.click();
    await vi.waitFor(() => expect(create).toHaveBeenCalled());
    await fixture.whenStable();
  }

  it('creates with a 90 day expiry by default', async () => {
    await open();
    await type('#api-key-comment', 'CI');
    expect(q('#stepper_next')!.textContent).toContain('Create');
    // The date the choice resolves to is shown beside it.
    expect(text()).toContain(new Date('2027-01-26T12:00:00Z').toLocaleDateString());
    await clickNext();
    expect(create).toHaveBeenCalledWith('CI', '2027-01-26T12:00:00.000Z');
  });

  it('sends no expiry for Never', async () => {
    await open();
    await type('#api-key-comment', 'CI');
    await type('#api-key-expiry', 'never', 'change');
    await clickNext();
    expect(create).toHaveBeenCalledWith('CI', null);
  });

  it('a chosen date means the end of that local day, sent as UTC', async () => {
    await open();
    await type('#api-key-comment', 'CI');
    await type('#api-key-expiry', 'date', 'change');
    await type('#api-key-date', '2027-03-05', 'input');
    await clickNext();
    expect(create).toHaveBeenCalledWith('CI', new Date(2027, 2, 5, 23, 59, 59).toISOString());
  });

  it('caps the date at the backend limit and starts it tomorrow', async () => {
    await open();
    await type('#api-key-expiry', 'date', 'change');
    const date = q<HTMLInputElement>('#api-key-date')!;
    // The last local day that ends by the server's cap, whatever the zone.
    const cap = Date.UTC(2038, 0, 19, 3, 14, 7);
    const days = [16, 17, 18, 19, 20].filter(d => new Date(2038, 0, d, 23, 59, 59).getTime() <= cap);
    expect(date.max).toBe(`2038-01-${days.at(-1)}`);
    expect(date.min).toBe('2026-10-29');
  });

  it('needs a description', async () => {
    await open();
    expect(q<HTMLButtonElement>('#stepper_next')!.disabled).toBe(true);
    await type('#api-key-comment', 'CI');
    expect(q<HTMLButtonElement>('#stepper_next')!.disabled).toBe(false);
  });

  it('prefills the description from a replacement', async () => {
    data = { comment: 'deploy script' };
    await open();
    expect(q<HTMLInputElement>('#api-key-comment')!.value).toBe('deploy script');
    expect(q<HTMLButtonElement>('#stepper_next')!.disabled).toBe(false);
  });

  it('shows the backend message when create fails, and stays on Details', async () => {
    create.mockRejectedValue(new Error('Expiry must be in the future'));
    await open();
    await type('#api-key-comment', 'CI');
    await clickNext();
    await vi.waitFor(() => expect(document.body.textContent).toContain('Expiry must be in the future'));
    expect(q('#api-key-comment')).toBeTruthy();
  });

  describe('Secret step', () => {
    beforeEach(async () => {
      await open();
      await type('#api-key-comment', 'CI');
      await clickNext();
      await vi.waitFor(() => expect(q('#apikey-secret')).toBeTruthy());
    });

    it('hides the secret until asked', async () => {
      const li = q('#apikey-secret')!;
      expect(li.textContent).not.toContain('the-secret');
      expect(li.querySelector('.sr-only')?.textContent).toBe('hidden');
      expect(li.querySelector('[aria-hidden="true"]')?.textContent).toMatch(/^•+$/);
      const toggle = q<HTMLButtonElement>('#apikey-secret button[aria-label="Hide Secret"]')!;
      expect(toggle.getAttribute('aria-pressed')).toBe('true');

      toggle.click();
      await fixture.whenStable();
      expect(li.textContent).toContain('the-secret');
      expect(toggle.getAttribute('aria-pressed')).toBe('false');
    });

    it('offers to copy and says there is no later view', () => {
      expect(q('app-copy-to-clipboard')).toBeTruthy();
      expect(text()).toContain('Record it now. There is no later way to view it.');
    });

    // Escape (and a backdrop click) would drop a secret not yet recorded;
    // the dialog's close guard refuses them while the Secret step shows.
    it('keeps Escape from closing; Done still closes', async () => {
      const ref = TestBed.inject(TailwindDialogRef);
      expect(ref.closeGuard?.()).toBe(true);
      q<HTMLButtonElement>('#stepper_next')!.click();
      await vi.waitFor(() => expect(close).toHaveBeenCalled());
      expect(ref.closeGuard?.()).toBe(false);
    });

    it('has no Previous and no Cancel; Done closes', async () => {
      expect(q('#stepper_previous')).toBeNull();
      expect(q('#stepper_cancel')).toBeNull();
      expect(q('#stepper_next')!.textContent).toContain('Done');
      q<HTMLButtonElement>('#stepper_next')!.click();
      await vi.waitFor(() => expect(close).toHaveBeenCalled());
    });
  });

  it('lets Escape close on Details', async () => {
    await open();
    await type('#api-key-comment', 'CI');
    expect(TestBed.inject(TailwindDialogRef).closeGuard?.() ?? false).toBe(false);
  });

  it('Cancel on Details closes', async () => {
    await open();
    q<HTMLButtonElement>('#stepper_cancel')!.click();
    expect(close).toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });
});
