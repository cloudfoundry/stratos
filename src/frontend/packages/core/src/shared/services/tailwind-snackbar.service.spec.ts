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
    vi.useRealTimers();
    document.querySelectorAll('.snackbar-box').forEach(box => box.remove());
  });

  const tabs = () => Array.from(document.querySelectorAll<HTMLElement>('.snackbar-box:not([inert]) [role="tab"]'));
  const numbers = () => tabs().map(t => t.querySelector('.snackbar-tab-number')!.textContent);
  const selected = () => tabs().filter(t => t.getAttribute('aria-selected') === 'true')
    .map(t => t.querySelector('.snackbar-tab-number')!.textContent);
  const strip = () => document.querySelector<HTMLElement>('.snackbar-box:not([inert]) [role="tablist"]')!;
  const shown = () => Array.from(document.querySelectorAll<HTMLElement>('.snackbar-box:not([inert]) .snackbar-message'))
    .filter(el => !el.closest<HTMLElement>('.snackbar-panel')!.hidden)
    .map(el => el.textContent);
  const closeShown = () => {
    const panel = Array.from(document.querySelectorAll<HTMLElement>('.snackbar-box:not([inert]) .snackbar-panel'))
      .find(p => !p.hidden)!;
    (panel.querySelector('.snackbar-close') as HTMLElement).click();
  };

  // A toast inserted with its text already in it is not reliably read out;
  // the announcer's live region, which is already on the page, is.
  it('announces each message to screen readers, errors assertively, and names the Dismiss control', () => {
    const announce = vi.spyOn(TestBed.inject(LiveAnnouncer), 'announce').mockResolvedValue();
    service.show('Saved');
    service.error('It broke');
    expect(announce).toHaveBeenNthCalledWith(1, 'Saved', 'polite');
    expect(announce).toHaveBeenNthCalledWith(2, 'It broke', 'assertive');
    const closes = document.querySelectorAll('.snackbar-close');
    expect(closes).toHaveLength(2);
    closes.forEach(b => expect(b.getAttribute('aria-label') ?? b.textContent).toBe('Dismiss'));
  });

  // Each message had two controls that both closed it: the caller's
  // "Dismiss" action and a "×". Now there is one, reading "Dismiss".
  describe('one Dismiss control per message', () => {
    const shownPanel = () => Array.from(document.querySelectorAll<HTMLElement>('.snackbar-box:not([inert]) .snackbar-panel'))
      .find(p => !p.hidden)!;
    const buttons = () => Array.from(shownPanel().querySelectorAll<HTMLButtonElement>('button'));

    it('a message with no action shows exactly one "Dismiss" control and no "×"', () => {
      service.open('broker failed', undefined, { duration: 0 });
      expect(buttons().map(b => b.textContent)).toEqual(['Dismiss']);
      expect(buttons()[0].classList).toContain('snackbar-close');
      expect(shownPanel().textContent).not.toContain('×');
    });

    it('error() with its default action shows exactly one control', () => {
      service.error('broker failed');
      expect(buttons().map(b => b.textContent)).toEqual(['Dismiss']);
      expect(shownPanel().querySelector('.snackbar-action')).toBeNull();
      expect(shownPanel().textContent).not.toContain('×');
    });

    // 'Close' closes the message too; it would be a second close control.
    it('a "Close" action shows exactly one control, reading "Dismiss"', () => {
      service.show('Auth token copied to clipboard', 'Close');
      expect(buttons().map(b => b.textContent)).toEqual(['Dismiss']);
      expect(shownPanel().querySelector('.snackbar-action')).toBeNull();
    });

    it('a "Close" action fires onAction() from "Dismiss", as "Dismiss" does', () => {
      const viaAction = vi.fn();
      const dismissed = vi.fn();
      const ref = service.show('Failed to delete release', 'Close');
      ref.onAction().subscribe(viaAction);
      ref.afterDismissed().subscribe(dismissed);
      (shownPanel().querySelector('.snackbar-close') as HTMLElement).click();
      expect(viaAction).toHaveBeenCalledTimes(1);
      expect(dismissed).toHaveBeenCalledTimes(1);
    });

    it('matches "Close" exactly; another label keeps its own button', () => {
      service.show('Saved', 'close');
      expect(buttons().map(b => b.textContent)).toEqual(['close', 'Dismiss']);
    });

    it('a real action keeps its own button beside "Dismiss"', () => {
      service.error('Endpoint needs re-authentication.', 'Reconnect');
      expect(buttons().map(b => b.textContent)).toEqual(['Reconnect', 'Dismiss']);
      expect(shownPanel().querySelector('.snackbar-action')!.textContent).toBe('Reconnect');
    });

    it('a message that times out on its own still has "Dismiss"', () => {
      service.show('Saved');
      expect(buttons().map(b => b.textContent)).toEqual(['Dismiss']);
    });

    it('clicking "Dismiss" closes only that tab', () => {
      service.error('one');
      service.error('two');
      const dismiss = shownPanel().querySelector('.snackbar-close') as HTMLElement;
      expect(dismiss.textContent).toBe('Dismiss');
      dismiss.click();
      expect(numbers()).toEqual(['1']);
      expect(shown()).toEqual(['one']);
    });

    it('its accessible name is "Dismiss", the text on screen', () => {
      service.error('broker failed');
      const dismiss = shownPanel().querySelector<HTMLButtonElement>('.snackbar-close')!;
      expect(dismiss.textContent).toBe('Dismiss');
      expect(dismiss.getAttribute('aria-label') ?? dismiss.textContent).toBe('Dismiss');
      expect(dismiss.type).toBe('button');
    });

    // Callers that passed 'Dismiss' as their action saw onAction() fire
    // when it was clicked; a message with no action did not.
    it('keeps onAction() for a caller whose action was "Dismiss", and only then', () => {
      const viaAction = vi.fn();
      const viaClose = vi.fn();
      const dismissed = vi.fn();
      const first = service.error('one');
      first.onAction().subscribe(viaAction);
      first.afterDismissed().subscribe(dismissed);
      (shownPanel().querySelector('.snackbar-close') as HTMLElement).click();
      expect(viaAction).toHaveBeenCalledTimes(1);
      expect(dismissed).toHaveBeenCalledTimes(1);
      service.open('two', undefined, { duration: 0 }).onAction().subscribe(viaClose);
      (shownPanel().querySelector('.snackbar-close') as HTMLElement).click();
      expect(viaClose).not.toHaveBeenCalled();
    });
  });

  // Every toast sat at the same fixed spot, so a second one covered the
  // first, which peeked out behind it and could take clicks meant for the
  // new one. Open messages now share one box at that spot, one tab each.
  it('a single message has no tab strip, as before', () => {
    service.error('broker failed');
    expect(document.querySelectorAll('.snackbar-box')).toHaveLength(1);
    expect(strip().hidden).toBe(true);
    expect(shown()).toEqual(['broker failed']);
  });

  it('two messages share one box with tabs 1 and 2, the newest selected', () => {
    service.error('first failure');
    service.error('second failure');
    expect(document.querySelectorAll('.snackbar-box')).toHaveLength(1);
    expect(strip().hidden).toBe(false);
    expect(numbers()).toEqual(['1', '2']);
    expect(selected()).toEqual(['2']);
    expect(shown()).toEqual(['second failure']);
  });

  it('closing tab 2 of two leaves tab 1 shown and hides the strip', () => {
    service.error('first failure');
    service.error('second failure');
    closeShown();
    expect(numbers()).toEqual(['1']);
    expect(selected()).toEqual(['1']);
    expect(strip().hidden).toBe(true);
    expect(shown()).toEqual(['first failure']);
  });

  it('closing a tab keeps the other numbers; the next message takes the next number', () => {
    service.error('one');
    const two = service.error('two');
    service.error('three');
    two.dismiss();
    expect(numbers()).toEqual(['1', '3']);
    service.error('four');
    expect(numbers()).toEqual(['1', '3', '4']);
    expect(selected()).toEqual(['4']);
  });

  it('closing tab 1 of three leaves tabs 2 and 3 numbered as they were', () => {
    const one = service.error('one');
    service.error('two');
    service.error('three');
    one.dismiss();
    expect(numbers()).toEqual(['2', '3']);
  });

  it('numbering starts again at 1 once every tab is dismissed', () => {
    service.error('one').dismiss();
    service.error('two').dismiss();
    service.error('three');
    service.error('four');
    expect(numbers()).toEqual(['1', '2']);
  });

  it('closing the selected tab selects a neighbour', () => {
    service.error('one');
    service.error('two');
    service.error('three');
    tabs()[1].click();
    expect(selected()).toEqual(['2']);
    closeShown();
    expect(selected()).toEqual(['3']);
    expect(shown()).toEqual(['three']);
    closeShown();
    expect(selected()).toEqual(['1']);
  });

  // The focused close button goes with its tab; focus moves to the tab
  // now selected rather than falling back to the page.
  it('closing the focused message moves focus to the tab now selected', () => {
    service.error('one');
    service.error('two');
    service.error('three');
    const panel = Array.from(document.querySelectorAll<HTMLElement>('.snackbar-panel')).find(p => !p.hidden)!;
    const close = panel.querySelector('.snackbar-close') as HTMLElement;
    close.focus();
    close.click();
    expect(selected()).toEqual(['2']);
    expect(document.activeElement).toBe(tabs()[1]);
  });

  const closeAll = () => document.querySelector<HTMLElement>('.snackbar-box:not([inert]) .snackbar-close-all')!;

  it('a "Close all" button sits beside the strip once two or more tabs are open', () => {
    service.error('one');
    expect(closeAll().hidden).toBe(true);
    service.error('two');
    expect(closeAll().hidden).toBe(false);
    expect(closeAll().textContent).toBe('Close all');
    expect(closeAll().getAttribute('type')).toBe('button');
    // A tablist holds only tabs; the button is next to it, not in it.
    expect(strip().contains(closeAll())).toBe(false);
    closeShown();
    expect(closeAll().hidden).toBe(true);
  });

  it('a lone repeated message shows no "Close all"', () => {
    service.error('broker failed');
    service.error('broker failed');
    expect(closeAll().hidden).toBe(true);
  });

  it('"Close all" closes every tab and the box, each through its ref', () => {
    const dismissed: string[] = [];
    service.error('one').afterDismissed().subscribe(() => dismissed.push('one'));
    service.show('two', 'Dismiss').afterDismissed().subscribe(() => dismissed.push('two'));
    service.error('three').afterDismissed().subscribe(() => dismissed.push('three'));
    const box = document.querySelector('.snackbar-box') as HTMLElement;
    closeAll().click();
    expect(dismissed).toEqual(['one', 'two', 'three']);
    expect(box.hasAttribute('inert')).toBe(true);
    expect(tabs()).toHaveLength(0);
  });

  it('numbering starts again at 1 after "Close all"', () => {
    service.error('one');
    service.error('two');
    closeAll().click();
    service.error('three');
    service.error('four');
    expect(numbers()).toEqual(['1', '2']);
  });

  // A merged set is one message: its own close button closes the set.
  it('a message\'s close button closes only that message, a whole set when merged', () => {
    service.error('one');
    service.error('two');
    service.error('two');
    closeShown();
    expect(numbers()).toEqual(['1']);
    expect(shown()).toEqual(['one']);
  });

  // Closing the box takes the focused control with it. Focus goes back to
  // where it was just before it entered the box, not to the page.
  describe('focus when the box closes', () => {
    let outside: HTMLButtonElement;
    let elsewhere: HTMLButtonElement;
    beforeEach(() => {
      outside = document.createElement('button');
      elsewhere = document.createElement('button');
      document.body.append(outside, elsewhere);
    });
    afterEach(() => {
      outside.remove();
      elsewhere.remove();
    });
    const closeButton = () => document.querySelector<HTMLElement>(
      '.snackbar-box:not([inert]) .snackbar-panel:not([hidden]) .snackbar-close')!;

    it('"Close all" returns focus to where it was before it entered the box', () => {
      outside.focus();
      service.error('one');
      service.error('two');
      tabs()[1].focus();
      closeAll().focus();
      closeAll().click();
      expect(document.activeElement).toBe(outside);
    });

    it('closing the last message returns focus there too', () => {
      outside.focus();
      service.error('one');
      closeButton().focus();
      closeButton().click();
      expect(document.activeElement).toBe(outside);
    });

    it('records where focus came from each time it enters the box', () => {
      outside.focus();
      service.error('one');
      closeButton().focus();
      elsewhere.focus();
      closeButton().focus();
      closeButton().click();
      expect(document.activeElement).toBe(elsewhere);
    });

    it('forgets an older element when focus last entered the box from the page', () => {
      outside.focus();
      service.error('one');
      closeButton().focus();
      outside.focus();
      outside.blur();
      closeButton().focus();
      const focus = vi.spyOn(outside, 'focus');
      closeButton().click();
      expect(focus).not.toHaveBeenCalled();
    });

    it('leaves focus alone when the element it came from is gone', () => {
      outside.focus();
      service.error('one');
      closeButton().focus();
      const focus = vi.spyOn(outside, 'focus');
      outside.remove();
      closeButton().click();
      expect(focus).not.toHaveBeenCalled();
    });

    // A browser blurs a focused element once it is hidden or made inert,
    // so by the last close focus can already be on the page; the test DOM
    // keeps it. These specs make hiding and inert blur, as a browser does.
    describe('when hiding or inert blurs the focused element, as in a browser', () => {
      const restore: (() => void)[] = [];
      const blurIfFocusedIn = (el: Element) => {
        if (el.contains(document.activeElement)) {
          (document.activeElement as HTMLElement).blur();
        }
      };
      beforeEach(() => {
        let proto: object | null = HTMLElement.prototype;
        let hidden: PropertyDescriptor | undefined;
        while (proto && !(hidden = Object.getOwnPropertyDescriptor(proto, 'hidden'))) {
          proto = Object.getPrototypeOf(proto);
        }
        Object.defineProperty(HTMLElement.prototype, 'hidden', {
          configurable: true,
          get(this: HTMLElement) { return hidden!.get!.call(this); },
          set(this: HTMLElement, value: boolean) {
            hidden!.set!.call(this, value);
            if (value) {
              blurIfFocusedIn(this);
            }
          },
        });
        restore.push(() => {
          if (proto === HTMLElement.prototype) {
            Object.defineProperty(HTMLElement.prototype, 'hidden', hidden!);
          } else {
            delete (HTMLElement.prototype as { hidden?: boolean }).hidden;
          }
        });
        const setAttribute = Element.prototype.setAttribute;
        Element.prototype.setAttribute = function (this: Element, name: string, value: string) {
          setAttribute.call(this, name, value);
          if (name === 'inert' || name === 'hidden') {
            blurIfFocusedIn(this);
          }
        };
        restore.push(() => { Element.prototype.setAttribute = setAttribute; });
      });
      afterEach(() => restore.splice(0).reverse().forEach(undo => undo()));

      it('"Close all" with three tabs returns focus though the button hides on the way', () => {
        outside.focus();
        service.error('one');
        service.error('two');
        service.error('three');
        closeAll().focus();
        closeAll().click();
        expect(document.activeElement).toBe(outside);
      });

      it('closing the last message returns focus though its panel goes inert first', () => {
        outside.focus();
        service.error('one');
        closeButton().focus();
        closeButton().click();
        expect(document.activeElement).toBe(outside);
      });

      it('still leaves focus alone when it was outside the box', () => {
        outside.focus();
        service.error('one');
        service.error('two');
        closeAll().focus();
        elsewhere.focus();
        const focus = vi.spyOn(outside, 'focus');
        service.dismiss();
        expect(focus).not.toHaveBeenCalled();
        expect(document.activeElement).toBe(elsewhere);
      });
    });

    it('leaves focus alone when it is outside the box as the box closes', () => {
      vi.useFakeTimers();
      outside.focus();
      service.show('Saved');
      const close = closeButton();
      close.focus();
      elsewhere.focus();
      const focus = vi.spyOn(outside, 'focus');
      vi.advanceTimersByTime(5000);
      expect(focus).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(elsewhere);
    });
  });

  it('clicking a tab shows its message', () => {
    service.error('one');
    service.show('two', 'Dismiss');
    tabs()[0].click();
    expect(selected()).toEqual(['1']);
    expect(shown()).toEqual(['one']);
  });

  it('has no cap on the number of tabs', () => {
    for (let i = 1; i <= 30; i++) {
      service.error(`failure ${i}`);
    }
    expect(tabs()).toHaveLength(30);
    expect(selected()).toEqual(['30']);
  });

  // The strip scrolls sideways instead of widening the box past the page.
  it('the tab strip scrolls sideways when the tabs overflow', () => {
    service.error('one');
    service.error('two');
    expect(strip().classList).toContain('overflow-x-auto');
  });

  // A run of the same message, as when one failing call raises the same
  // error back to back, is one set: a repeat of the newest message joins
  // its tab.
  it('a repeat of the newest message joins its tab, counted, instead of adding one', () => {
    const announce = vi.spyOn(TestBed.inject(LiveAnnouncer), 'announce').mockResolvedValue();
    service.error('other failure');
    const first = service.error('broker failed');
    tabs()[0].click();
    const again = service.error('broker failed');
    expect(again).toBe(first);
    expect(numbers()).toEqual(['1', '2']);
    expect(selected()).toEqual(['2']);
    expect(setCount().textContent).toBe('(2)');
    expect(tabs()[1].getAttribute('aria-label')).toBe('Message 2');
    expect(announce).toHaveBeenLastCalledWith('broker failed (Shown 2 times)', 'assertive');
    expect(announce).toHaveBeenCalledTimes(3);
  });

  // Only a repeat of the newest message is a set; the same text after
  // something else is a new event and gets its own tab.
  it('a repeat of an older open message gets a new tab', () => {
    const first = service.error('broker failed');
    service.error('other failure');
    const again = service.error('broker failed');
    expect(again).not.toBe(first);
    expect(numbers()).toEqual(['1', '2', '3']);
    expect(selected()).toEqual(['3']);
    expect(document.querySelector('.snackbar-set-count:not([hidden])')).toBeNull();
  });

  // The newest is the tab with the last number given out; once it is
  // closed, an older open tab with the same text is still not it.
  it('a repeat after the newest tab closed gets a new tab, even if an older one matches', () => {
    service.error('one');
    service.error('two');
    service.error('three').dismiss();
    service.error('two');
    expect(numbers()).toEqual(['1', '2', '4']);
    expect(document.querySelector('.snackbar-set-count:not([hidden])')).toBeNull();
  });

  const setCount = () => document.querySelector<HTMLElement>('.snackbar-panel:not([hidden]) .snackbar-set-count')!;
  const setCountText = () =>
    document.querySelector<HTMLElement>('.snackbar-panel:not([hidden]) .snackbar-set-count-text')!;

  // The count goes on the message's first line, so a set takes no more
  // room than one message. The visible "(N)" is hidden from screen
  // readers, which read "Shown N times" instead; the tooltip is for the
  // mouse.
  it('a set shows "(N)" at the start of its message, with a tooltip and screen reader text', () => {
    service.error('broker failed\ncode 502');
    service.error('broker failed\ncode 502');
    service.error('broker failed\ncode 502');
    expect(setCount().hidden).toBe(false);
    expect(setCount().textContent).toBe('(3)');
    expect(setCount().title).toBe('Shown 3 times');
    expect(setCount().getAttribute('aria-hidden')).toBe('true');
    expect(setCountText().hidden).toBe(false);
    expect(setCountText().textContent).toBe('Shown 3 times');
    expect(setCountText().classList).toContain('sr-only');
    // Same line as the message, before it; the message text is unchanged.
    const message = document.querySelector<HTMLElement>('.snackbar-message')!;
    const line = message.parentElement!;
    expect(setCount().parentElement).toBe(line);
    expect(setCountText().parentElement).toBe(line);
    const order = Array.from(line.children);
    expect(order.indexOf(setCount())).toBeLessThan(order.indexOf(message));
    expect(order.indexOf(setCountText())).toBeLessThan(order.indexOf(message));
    expect(message.textContent).toBe('broker failed\ncode 502');
    expect(shown()).toEqual(['broker failed\ncode 502']);
  });

  it('a message shown once has no count in its text', () => {
    service.error('broker failed');
    expect(setCount().hidden).toBe(true);
    expect(setCountText().hidden).toBe(true);
  });

  it('update() on a set keeps its count', () => {
    service.error('Deleting… 0 of 5');
    const ref = service.error('Deleting… 0 of 5');
    ref.update('Deleting… 3 of 5');
    expect(shown()).toEqual(['Deleting… 3 of 5']);
    expect(setCount().textContent).toBe('(2)');
  });

  // A lone message, repeated or not, looks as a toast always has: no
  // strip, and a set's count at the start of its text.
  it('a repeated lone message has no strip; its text starts with "(2)"', () => {
    service.error('broker failed');
    service.error('broker failed');
    expect(strip().hidden).toBe(true);
    const panel = document.querySelector<HTMLElement>('.snackbar-box:not([inert]) .snackbar-panel')!;
    expect(panel.hasAttribute('role')).toBe(false);
    const line = panel.querySelector<HTMLElement>('.snackbar-text')!;
    expect(line.firstElementChild).toBe(setCount());
    expect(line.textContent!.startsWith('(2)')).toBe(true);
    expect(shown()).toEqual(['broker failed']);
  });

  // The count is shown once, in the message; the tab is only its number.
  it('a set\'s tab shows only its number; the count starts its message', () => {
    service.error('other failure');
    service.error('broker failed');
    service.error('broker failed');
    expect(tabs()[1].textContent).toBe('2');
    expect(tabs()[1].querySelector('.snackbar-count')).toBeNull();
    expect(tabs()[1].getAttribute('aria-label')).toBe('Message 2');
    const line = document.querySelector<HTMLElement>('.snackbar-panel:not([hidden]) .snackbar-text')!;
    expect(line.firstElementChild).toBe(setCount());
    expect(setCount().textContent).toBe('(2)');
  });

  it('the same text of a different kind gets its own tab', () => {
    service.show('Request failed');
    service.error('Request failed');
    expect(numbers()).toEqual(['1', '2']);
  });

  it('an identical message restarts the auto-dismiss timer of its tab', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    service.show('Saved').afterDismissed().subscribe(onDismiss);
    vi.advanceTimersByTime(4000);
    service.show('Saved');
    vi.advanceTimersByTime(4000);
    expect(onDismiss).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('a message that closes itself removes only its own tab', () => {
    vi.useFakeTimers();
    const errorDismissed = vi.fn();
    service.error('broker failed').afterDismissed().subscribe(errorDismissed);
    service.show('Saved');
    expect(numbers()).toEqual(['1', '2']);
    vi.advanceTimersByTime(5000);
    expect(numbers()).toEqual(['1']);
    expect(shown()).toEqual(['broker failed']);
    expect(errorDismissed).not.toHaveBeenCalled();
  });

  it('the strip is a tablist whose tabs control their message panels', () => {
    service.error('one');
    service.error('two');
    service.error('three');
    const list = strip();
    expect(list.getAttribute('role')).toBe('tablist');
    expect(tabs().map(t => t.getAttribute('aria-selected'))).toEqual(['false', 'false', 'true']);
    expect(tabs().map(t => t.getAttribute('tabindex'))).toEqual(['-1', '-1', '0']);
    tabs().forEach(t => {
      const panel = document.getElementById(t.getAttribute('aria-controls')!)!;
      expect(panel.getAttribute('role')).toBe('tabpanel');
      expect(panel.getAttribute('aria-labelledby')).toBe(t.id);
    });
    expect(tabs().map(t => t.getAttribute('aria-label')))
      .toEqual(['Message 1', 'Message 2', 'Message 3']);
  });

  it('arrow, Home and End keys move the selection and focus along the strip', () => {
    service.error('one');
    service.error('two');
    service.error('three');
    const key = (k: string) => {
      const focused = tabs().find(t => t.getAttribute('aria-selected') === 'true')!;
      focused.focus();
      focused.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
    };
    key('ArrowLeft');
    expect(selected()).toEqual(['2']);
    expect(document.activeElement).toBe(tabs()[1]);
    key('Home');
    expect(selected()).toEqual(['1']);
    key('ArrowLeft');
    expect(selected()).toEqual(['3']);
    key('ArrowRight');
    expect(selected()).toEqual(['1']);
    key('End');
    expect(selected()).toEqual(['3']);
    expect(shown()).toEqual(['three']);
    expect(document.activeElement).toBe(tabs()[2]);
  });

  it('message text and tab numbers are text, never markup', () => {
    service.error('<b>bold</b> failure');
    service.error('second');
    const box = document.querySelector('.snackbar-box')!;
    expect(box.querySelector('b')).toBeNull();
    expect(tabs()[0].getAttribute('aria-controls')).toBeTruthy();
    tabs()[0].click();
    expect(shown()).toEqual(['<b>bold</b> failure']);
  });

  // The service-level dismiss() closes everything, and afterDismissed()
  // has to fire for every open message.
  it('service dismiss() closes every open message through its ref', () => {
    const dismissed: string[] = [];
    service.error('one').afterDismissed().subscribe(() => dismissed.push('one'));
    service.show('two', 'Dismiss').afterDismissed().subscribe(() => dismissed.push('two'));
    const box = document.querySelector('.snackbar-box') as HTMLElement;
    service.dismiss();
    expect(dismissed).toEqual(['one', 'two']);
    expect(box.hasAttribute('inert')).toBe(true);
  });

  it('a dismissed snackbar takes no clicks or focus while it fades out', () => {
    const ref = service.error('broker failed');
    const bar = document.querySelector('.snackbar-error') as HTMLElement;
    const box = bar.closest('.snackbar-box') as HTMLElement;
    ref.dismiss();
    expect(bar.hasAttribute('inert')).toBe(true);
    expect(box.hasAttribute('inert')).toBe(true);
  });

  it('a message after the box began fading out opens a new box', () => {
    service.error('one').dismiss();
    service.error('two');
    expect(shown()).toEqual(['two']);
    expect(numbers()).toEqual(['1']);
  });

  // The announcer's live region keeps the last message until something
  // replaces it, so a closed toast would still be found there.
  it('clears the announced message when its tab is closed', () => {
    const announcer = TestBed.inject(LiveAnnouncer);
    vi.spyOn(announcer, 'announce').mockResolvedValue();
    const clear = vi.spyOn(announcer, 'clear');
    service.error('broker failed').dismiss();
    expect(clear).toHaveBeenCalledTimes(1);
  });

  // Closing an older tab must not wipe the announcement of the newer one.
  it('closing a tab that is not the announced one leaves the live region alone', () => {
    const announcer = TestBed.inject(LiveAnnouncer);
    vi.spyOn(announcer, 'announce').mockResolvedValue();
    const first = service.show('Saved', 'Dismiss');
    service.error('broker failed');
    const clear = vi.spyOn(announcer, 'clear');
    first.dismiss();
    expect(clear).not.toHaveBeenCalled();
  });

  // A closed message's own timer or close can still fire later; that must
  // not wipe the announcement of a message opened since.
  it('a closed message dismissed again later leaves the live region alone', () => {
    const announcer = TestBed.inject(LiveAnnouncer);
    vi.spyOn(announcer, 'announce').mockResolvedValue();
    const first = service.show('Saved', 'Dismiss');
    first.dismiss();
    service.error('broker failed');
    const clear = vi.spyOn(announcer, 'clear');
    first.dismiss();
    expect(clear).not.toHaveBeenCalled();
    expect(shown()).toEqual(['broker failed']);
  });

  // A link is part of the message: the same words leading somewhere else
  // are a different message.
  it('a link message joins a set only when its destination matches too', () => {
    service.showWithLink('You were switched', '/cf/spaces/1', 'Return');
    service.showWithLink('You were switched', '/cf/spaces/2', 'Return');
    expect(numbers()).toEqual(['1', '2']);
    service.showWithLink('You were switched', '/cf/spaces/2', 'Return');
    expect(numbers()).toEqual(['1', '2']);
    expect(setCount().textContent).toBe('(2)');
  });

  it('route arrays are compared as destinations too', () => {
    service.showWithLink('Analysis complete', ['kubernetes', 'ep1'], 'View');
    service.showWithLink('Analysis complete', ['kubernetes', 'ep2'], 'View');
    expect(numbers()).toEqual(['1', '2']);
    service.showWithLink('Analysis complete', ['kubernetes', 'ep2'], 'View');
    expect(numbers()).toEqual(['1', '2']);
  });

  it('a link message is not the same as one with no link', () => {
    service.show('Saved', 'View');
    service.showWithLink('Saved', '/apps', 'View');
    expect(numbers()).toEqual(['1', '2']);
  });

  it('a link that joined a set navigates once per click', () => {
    service.showWithLink('You were switched', '/cf/spaces/1', 'Return');
    service.showWithLink('You were switched', '/cf/spaces/1', 'Return');
    (document.querySelector('.snackbar-action') as HTMLElement).click();
    expect(router.navigateByUrl).toHaveBeenCalledTimes(1);
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

  // Both stay open together again (as tabs), so one hide() call can be
  // checked against both, as it was before the one-at-a-time change.
  it('hide dismisses snackbars opened via show but leaves error snackbars up', () => {
    const dismissed: string[] = [];
    service.show('registered').afterDismissed().subscribe(() => dismissed.push('shown'));
    service.error('broker failed').afterDismissed().subscribe(() => dismissed.push('error'));
    service.hide();
    expect(dismissed).toEqual(['shown']);
    expect(shown()).toEqual(['broker failed']);
  });

  // White on --color-danger measured 3.76:1 (light) / 2.77:1 (dark) and the
  // primary-blue action 1.02:1; danger-700 gives white 4.98:1 (WCAG AA).
  it('error snackbars are readable: dark red, white action and Dismiss', () => {
    service.error('broker failed', 'Reconnect');
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

  it('other snackbars style the action and "Dismiss" as primary text on the dark toast', () => {
    service.open('saved', 'Undo');
    const bar = document.querySelector('.snackbar-action')!.parentElement as HTMLElement;
    expect(bar.classList).not.toContain('snackbar-error');
    expect(bar.querySelector('.snackbar-action')!.classList).toContain('text-primary');
    expect(bar.querySelector('.snackbar-close')!.classList).toContain('text-primary');
    expect(bar.querySelector('.snackbar-close')!.classList).not.toContain('text-gray-400');
  });

  it('show with a close message does not auto-dismiss', () => {
    vi.useFakeTimers();
    const ref = service.show('note', 'Dismiss');
    const onDismiss = vi.fn();
    ref.afterDismissed().subscribe(onDismiss);
    vi.advanceTimersByTime(10000);
    expect(onDismiss).not.toHaveBeenCalled();
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
  // An upstream error page reads as a heading and lines of text; each piece
  // is its own text node, so markup inside one stays text.
  it('error() shows message pieces styled, as text, and announces their text', () => {
    const announce = vi.spyOn(TestBed.inject(LiveAnnouncer), 'announce').mockResolvedValue();
    service.error([
      { text: 'Delete failed: ', style: 'text' },
      { text: '502 Bad Gateway', style: 'heading' },
      { text: '\n<img src=x onerror=alert(1)>', style: 'text' },
    ]);
    const message = document.querySelector('.snackbar-message') as HTMLElement;
    expect(Array.from(message.children).map(c => [c.tagName, c.textContent, c.className])).toEqual([
      ['SPAN', 'Delete failed: ', ''],
      ['SPAN', '502 Bad Gateway', 'font-semibold'],
      ['SPAN', '\n<img src=x onerror=alert(1)>', ''],
    ]);
    expect(message.querySelector('img')).toBeNull();
    expect(message.classList).toContain('whitespace-pre-line');
    expect(announce).toHaveBeenCalledWith('Delete failed: 502 Bad Gateway\n<img src=x onerror=alert(1)>', 'assertive');
  });

  it('show() and open() take message pieces too', () => {
    service.show([{ text: 'Saved ', style: 'text' }, { text: 'app-1', style: 'code' }]);
    service.open([{ text: 'Working', style: 'em' }]);
    const messages = Array.from(document.querySelectorAll('.snackbar-message'));
    expect(messages.map(m => m.innerHTML)).toEqual([
      '<span>Saved </span><span class="font-mono">app-1</span>',
      '<span class="italic">Working</span>',
    ]);
  });

  // Each call builds its own array, so a repeat is found by its plain
  // text, not by the array it came in.
  it('identical message pieces from separate calls join one set, the count before the first piece', () => {
    const pieces = () => [
      { text: 'Delete failed: ', style: 'text' as const },
      { text: '502 Bad Gateway', style: 'heading' as const },
    ];
    const first = service.error(pieces());
    const again = service.error(pieces());
    expect(again).toBe(first);
    expect(numbers()).toEqual(['1']);
    expect(setCount().textContent).toBe('(2)');
    const message = document.querySelector<HTMLElement>('.snackbar-message')!;
    const line = Array.from(message.parentElement!.childNodes);
    expect(line.indexOf(setCount())).toBeLessThan(line.indexOf(message));
    expect(message.firstElementChild!.textContent).toBe('Delete failed: ');
  });

  it('pieces and a string with the same plain text are the same message', () => {
    const first = service.error([{ text: 'Request ', style: 'text' }, { text: 'failed', style: 'strong' }]);
    expect(service.error('Request failed')).toBe(first);
    expect(numbers()).toEqual(['1']);
  });
});
