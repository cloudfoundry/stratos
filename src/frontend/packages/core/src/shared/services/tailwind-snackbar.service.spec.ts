import { LiveAnnouncer } from '@angular/cdk/a11y';
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

  // A toast inserted with its text already in it is not reliably read out;
  // the announcer's live region, which is already on the page, is.
  it('announces each message to screen readers, errors assertively, and names the close button', () => {
    const announce = vi.spyOn(TestBed.inject(LiveAnnouncer), 'announce').mockResolvedValue();
    service.show('Saved');
    service.error('It broke');
    expect(announce).toHaveBeenNthCalledWith(1, 'Saved', 'polite');
    expect(announce).toHaveBeenNthCalledWith(2, 'It broke', 'assertive');
    const closes = document.querySelectorAll('.snackbar-close');
    expect(closes).toHaveLength(2);
    closes.forEach(b => expect(b.getAttribute('aria-label')).toBe('Close'));
  });

  // Every toast sits at the same fixed spot, so a second one covered the
  // first, which peeked out behind it and could take clicks meant for the
  // new one. Like the Material snack bar this replaced, a new toast now
  // dismisses the one on screen.
  it('shows one snackbar at a time: a new one dismisses the one on screen', () => {
    const firstDismissed = vi.fn();
    service.error('first failure').afterDismissed().subscribe(firstDismissed);
    service.error('second failure');
    const onScreen = Array.from(document.querySelectorAll('.snackbar-message'))
      .filter(el => !el.parentElement!.hasAttribute('inert'))
      .map(el => el.textContent);
    expect(onScreen).toEqual(['second failure']);
    expect(firstDismissed).toHaveBeenCalledTimes(1);
  });

  it('a dismissed snackbar takes no clicks or focus while it fades out', () => {
    const ref = service.error('broker failed');
    const bar = document.querySelector('.snackbar-error') as HTMLElement;
    ref.dismiss();
    expect(bar.hasAttribute('inert')).toBe(true);
  });

  // The announcer's live region keeps the last message until something
  // replaces it, so a closed toast would still be found there.
  it('clears the announced message when the snackbar on screen is dismissed', () => {
    const announcer = TestBed.inject(LiveAnnouncer);
    vi.spyOn(announcer, 'announce').mockResolvedValue();
    const clear = vi.spyOn(announcer, 'clear');
    service.error('broker failed').dismiss();
    expect(clear).toHaveBeenCalledTimes(1);
  });

  // The replaced toast's own timer or close can still fire later; that must
  // not wipe the announcement of the toast now on screen.
  it('a replaced snackbar dismissed again later leaves the live region alone', () => {
    const announcer = TestBed.inject(LiveAnnouncer);
    vi.spyOn(announcer, 'announce').mockResolvedValue();
    const first = service.show('Saved', 'Dismiss');
    service.error('broker failed');
    const clear = vi.spyOn(announcer, 'clear');
    first.dismiss();
    expect(clear).not.toHaveBeenCalled();
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
    const errorDismissed = vi.fn();
    service.error('broker failed').afterDismissed().subscribe(errorDismissed);
    service.hide();
    expect(errorDismissed).not.toHaveBeenCalled();
    const shownDismissed = vi.fn();
    service.show('registered').afterDismissed().subscribe(shownDismissed);
    service.hide();
    expect(shownDismissed).toHaveBeenCalledTimes(1);
  });

  // White on --color-danger measured 3.76:1 (light) / 2.77:1 (dark) and the
  // primary-blue action 1.02:1; danger-700 gives white 4.98:1 (WCAG AA).
  it('error snackbars are readable: dark red, white action and close', () => {
    service.error('broker failed');
    const bar = document.querySelector('.snackbar-error') as HTMLElement;
    expect(bar.classList).toContain('!bg-danger-700');
    expect(bar.classList).not.toContain('!bg-danger');
    const action = bar.querySelector('.snackbar-action') as HTMLElement;
    const close = bar.querySelector('.snackbar-close') as HTMLElement;
    expect(action.classList).toContain('text-white');
    expect(action.classList).not.toContain('text-primary');
    expect(close.classList).toContain('text-white');
    expect(close.classList).not.toContain('text-gray-400');
  });

  it('other snackbars keep the primary action and grey close on the dark toast', () => {
    service.open('saved', 'Undo');
    const bar = document.querySelector('.snackbar-action')!.parentElement as HTMLElement;
    expect(bar.classList).not.toContain('snackbar-error');
    expect(bar.querySelector('.snackbar-action')!.classList).toContain('text-primary');
    expect(bar.querySelector('.snackbar-close')!.classList).toContain('text-gray-400');
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
