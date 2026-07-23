import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { TailwindSnackBarService } from './tailwind-snackbar.service';

describe('TailwindSnackBarService', () => {
  let service: TailwindSnackBarService;
  const router = { navigate: vi.fn(), navigateByUrl: vi.fn() };

  beforeEach(() => {
    router.navigate.mockClear();
    router.navigateByUrl.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: Router, useValue: router },
      ],
    });
    service = TestBed.inject(TailwindSnackBarService);
  });

  afterEach(() => {
    document.querySelectorAll('.snackbar-close').forEach(btn => btn.parentElement?.remove());
  });

  it('showWithLink navigates to a route array when the action is clicked', () => {
    service.showWithLink('Analysis complete', ['kubernetes', 'ep1', 'analysis'], 'View');
    (document.querySelector('.snackbar-action') as HTMLElement).click();
    expect(router.navigate).toHaveBeenCalledWith(['kubernetes', 'ep1', 'analysis']);
  });

  it('showWithLink navigates by URL when given a string target', () => {
    service.showWithLink('You were switched to an organization', '/cf/spaces/1', 'Return to space');
    (document.querySelector('.snackbar-action') as HTMLElement).click();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/cf/spaces/1');
  });

  it('hide dismisses snackbars opened via show but leaves error snackbars up', () => {
    const dismissed: string[] = [];
    service.show('registered').afterDismissed().subscribe(() => dismissed.push('shown'));
    service.error('broker failed').afterDismissed().subscribe(() => dismissed.push('error'));
    service.hide();
    expect(dismissed).toEqual(['shown']);
  });

  it('show with a close message does not auto-dismiss', () => {
    vi.useFakeTimers();
    const ref = service.show('note', 'Dismiss');
    const onDismiss = vi.fn();
    ref.afterDismissed().subscribe(onDismiss);
    vi.advanceTimersByTime(10000);
    expect(onDismiss).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('update() replaces the message text of an open snackbar in place', () => {
    const ref = service.open('Deleting 5 applications… 0 of 5', undefined, { duration: 0 });
    const el = document.body.querySelector('.snackbar-message');
    expect(el?.textContent).toBe('Deleting 5 applications… 0 of 5');
    ref.update('Deleting 5 applications… 3 of 5');
    expect(document.body.querySelector('.snackbar-message')?.textContent)
      .toBe('Deleting 5 applications… 3 of 5');
    ref.dismiss();
  });

  it('update() is inert after dismiss to prevent race-condition mutations during fade', () => {
    const ref = service.open('Deleting 5 applications… 0 of 5', undefined, { duration: 0 });
    const el = document.body.querySelector('.snackbar-message') as HTMLElement;
    expect(el?.textContent).toBe('Deleting 5 applications… 0 of 5');
    ref.dismiss();
    // During the 300ms fade-out, the element is still in the DOM but update should not mutate it
    ref.update('Deleting 5 applications… 5 of 5');
    expect(el.textContent).toBe('Deleting 5 applications… 0 of 5');
  });
});
