import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Injectable, ApplicationRef, Injector, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, Observable } from 'rxjs';
import { take } from 'rxjs/operators';

export interface TailwindSnackBarConfig {
  duration?: number;
  action?: string;
  panelClass?: string | string[];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- intentional public-API generic: T mirrors MatSnackBarRef<T> (the attached component-instance type) so callers can type the ref; the impl propagates it via implements TailwindSnackBarRef<T>
export interface TailwindSnackBarRef<T> {
  afterDismissed(): Observable<any>;
  onAction(): Observable<any>;
  dismiss(): void;
  dismissWithAction(): void;
  update(message: string): void;
}

export class TailwindSnackBarRefImpl<T> implements TailwindSnackBarRef<T> {
  private _afterDismissed = new Subject<any>();
  private _onAction = new Subject<any>();

  constructor(
    private removeCallback: () => void,
    private updateCallback?: (message: string) => void,
  ) {}

  afterDismissed(): Observable<any> {
    return this._afterDismissed.asObservable();
  }

  onAction(): Observable<any> {
    return this._onAction.asObservable();
  }

  dismiss(): void {
    this.removeCallback();
    this._afterDismissed.next(null);
    this._afterDismissed.complete();
    // Prevent race-condition mutations during removeSnackbar's 300ms fade-out:
    // clear the update callback so that any in-flight update() calls (e.g. from
    // settlement polling in the caller) become inert and don't mutate a fading element.
    this.updateCallback = undefined;
  }

  dismissWithAction(): void {
    this._onAction.next(null);
    this.dismiss();
  }

  update(message: string): void {
    this.updateCallback?.(message);
  }
}

export class TailwindSimpleSnackBar {
  constructor(
    public snackBarRef: TailwindSnackBarRef<any>,
    public data: any
  ) {}

  dismiss(): void {
    this.snackBarRef.dismiss();
  }
}

// One open message in the snackbar box: its numbered tab, its panel and
// the ref its caller holds.
interface SnackbarEntry {
  number: number;
  // Panel classes and action label: with the text, two messages with the
  // same key are the same message and share a tab.
  key: string;
  error: boolean;
  count: number;
  duration: number;
  timer?: ReturnType<typeof setTimeout>;
  closed: boolean;
  ref: TailwindSnackBarRef<any>;
  tab: HTMLButtonElement;
  panel: HTMLElement;
}

// Ids tie each tab to its panel (aria-controls / aria-labelledby).
let nextId = 0;

@Injectable({
  providedIn: 'root'
})
export class TailwindSnackBarService {
  // Open messages share one box at the bottom centre of the page, one
  // numbered tab each. Toasts used to be placed one on top of another at
  // that spot, so an older one peeked out and caught clicks meant for the
  // newer one. A tab's number is never changed while any tab is open;
  // numbering starts again at 1 once every tab has been closed.
  private box?: HTMLElement;
  private strip?: HTMLElement;
  private entries: SnackbarEntry[] = [];
  private selected?: SnackbarEntry;
  private nextNumber = 1;
  // The message whose text the announcer's live region holds.
  private announced?: SnackbarEntry;

  private appRef = inject(ApplicationRef);
  private announcer = inject(LiveAnnouncer);
  private injector = inject(Injector);
  private router = inject(Router);

  // Snackbars opened via show()/showWithLink(), so hide() can dismiss them
  // without touching error() snackbars (which must stay until dismissed).
  private tracked: TailwindSnackBarRef<any>[] = [];

  // Show a snack bar with the given message.
  // If closeMessage is supplied a button to dismiss the snack bar is shown and the duration is ignored.
  // If closeMessage is not supplied, no action button is shown and the snack bar hides after the duration (default 5s).
  // If forceDuration is supplied the duration is used regardless of closeMessage.
  show(message: string, closeMessage?: string, duration = 5000, forceDuration = false): TailwindSnackBarRef<any> {
    return this.track(this.open(message, closeMessage, {
      duration: forceDuration ? duration : (closeMessage ? 0 : duration)
    }));
  }

  // Show a snack bar whose action button navigates to the given route.
  // Stays on screen until dismissed unless a duration is given.
  showWithLink(message: string, returnUrl: string | string[], returnLabel: string, duration?: number): TailwindSnackBarRef<any> {
    const ref = this.open(message, returnLabel, { duration: duration || 0 });
    // Navigate when the action button is clicked. onAction() emits once per click and
    // never completes, so this fires only on a real click; take(1) bounds it to one.
    ref.onAction().pipe(take(1)).subscribe(() => {
      if (Array.isArray(returnUrl)) {
        this.router.navigate(returnUrl);
      } else {
        this.router.navigateByUrl(returnUrl);
      }
    });
    return this.track(ref);
  }

  // Hide the snack bars opened via show()/showWithLink()
  hide(): void {
    this.tracked.forEach(ref => ref.dismiss());
  }

  private track(ref: TailwindSnackBarRef<any>): TailwindSnackBarRef<any> {
    this.tracked.push(ref);
    ref.afterDismissed().pipe(take(1)).subscribe(() => this.tracked = this.tracked.filter(r => r !== ref));
    return ref;
  }

  // Errors must stay on screen until the user dismisses them — the default
   // 4s auto-dismiss hid broker / 502 / job failures before the operator
   // could read them. Red panel class signals severity at a glance.
   error(message: string, action: string = 'Dismiss', config?: TailwindSnackBarConfig): TailwindSnackBarRef<any> {
    return this.open(message, action, {
      duration: 0,
      ...(config ?? {}),
      // danger-700, not danger: white on --color-danger is 3.76:1 (light) and
      // 2.77:1 (dark); on danger-700 it is 4.98:1, WCAG AA in both themes.
      panelClass: ['snackbar-error', '!bg-danger-700']
        .concat(config?.panelClass ? (Array.isArray(config.panelClass) ? config.panelClass : [config.panelClass]) : []),
    });
  }

  open(message: string, action?: string, config?: TailwindSnackBarConfig): TailwindSnackBarRef<any> {
    const panelClasses = config?.panelClass ? ([] as string[]).concat(config.panelClass) : [];
    const key = `${panelClasses.join(' ')}\n${action ?? ''}`;

    // The same message again (same text, kind and action) while its tab is
    // open joins that tab instead of adding one: its count goes up, it is
    // selected and announced again, and its timer, if any, starts over.
    const same = this.entries.find(e => e.key === key && this.messageOf(e) === message);
    if (same) {
      same.count++;
      this.startTimer(same);
      this.select(same);
      this.announce(same, message);
      return same.ref;
    }

    const id = nextId++;
    const panel = this.createSnackbarElement(message, action, config);
    panel.id = `snackbar-panel-${id}`;
    const tab = this.createTab(id, this.nextNumber, panel.id);
    const ref: TailwindSnackBarRef<any> = new TailwindSnackBarRefImpl(
      () => this.close(entry),
      (message: string) => {
        const el = panel.querySelector('.snackbar-message');
        if (el) { el.textContent = message; }
        // ZONELESS: keep parity with the other DOM mutations in this service
        this.appRef.tick();
      },
    );
    const entry: SnackbarEntry = {
      number: this.nextNumber++,
      key,
      error: panelClasses.includes('snackbar-error'),
      count: 1,
      // Use ?? instead of || so that an explicit `duration: 0` from the
      // caller means "do not auto-dismiss" (the standard convention) rather
      // than being treated as falsy and falling back to the 4s default.
      // Previously, callers that wanted a persistent error snackbar (e.g.
      // the stepper's "Dismiss" action) had their explicit `duration: 0`
      // silently overridden, causing the error to pop up and disappear
      // before the user could read it. This `duration: 0` =
      // stay-until-dismissed rule mirrors Angular Material's MatSnackBar,
      // so callers coming from Material get it.
      duration: config?.duration ?? 4000,
      closed: false,
      ref,
      tab,
      panel,
    };

    tab.addEventListener('click', () => {
      this.select(entry);
      // ZONELESS: Trigger change detection after user interaction
      this.appRef.tick();
    });

    // Add to DOM
    const box = this.box ?? this.createBox();
    this.strip!.appendChild(tab);
    box.appendChild(panel);
    this.entries.push(entry);
    this.select(entry);
    this.announce(entry, message);
    this.startTimer(entry);

    // Add event listeners
    const actionButton = panel.querySelector('.snackbar-action');
    if (actionButton) {
      actionButton.addEventListener('click', () => {
        ref.dismissWithAction();
        // ZONELESS: Trigger change detection after user interaction
        this.appRef.tick();
      });
    }

    const closeButton = panel.querySelector('.snackbar-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        ref.dismiss();
        // ZONELESS: Trigger change detection after user interaction
        this.appRef.tick();
      });
    }

    return ref;
  }

  // Close every open message, each through its own ref so that its
  // afterDismissed() fires. The stepper calls this to clear its error
  // before the next try; before the tabs this closed every toast on the
  // page too, so it still means all, not just the selected tab.
  dismiss(): void {
    [...this.entries].forEach(entry => entry.ref.dismiss());
  }

  private messageOf(entry: SnackbarEntry): string | null | undefined {
    return entry.panel.querySelector('.snackbar-message')?.textContent;
  }

  // Screen readers miss a toast that arrives with its text; the announcer's
  // live region is already on the page. Errors interrupt.
  private announce(entry: SnackbarEntry, message: string): void {
    this.announced = entry;
    void this.announcer.announce(message, entry.error ? 'assertive' : 'polite');
  }

  private startTimer(entry: SnackbarEntry): void {
    if (entry.duration > 0) {
      clearTimeout(entry.timer);
      entry.timer = setTimeout(() => {
        entry.ref.dismiss();
        // ZONELESS: Trigger change detection after async operation
        this.appRef.tick();
      }, entry.duration);
    }
  }

  private select(entry: SnackbarEntry): void {
    this.selected = entry;
    this.render();
    // Bring a tab scrolled out of the strip back into view.
    if (!this.strip!.hidden) {
      entry.tab.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    }
  }

  // Closes one message's tab. Runs for the close button, the action, the
  // timer and the caller's ref.dismiss(); only the first call counts, so a
  // closed message's late timer changes nothing.
  private close(entry: SnackbarEntry): void {
    if (entry.closed) {
      return;
    }
    entry.closed = true;
    clearTimeout(entry.timer);
    // Only the message the live region holds clears it; closing another
    // tab leaves a newer announcement alone.
    if (this.announced === entry) {
      this.announced = undefined;
      this.announcer.clear();
    }
    const index = this.entries.indexOf(entry);
    this.entries.splice(index, 1);
    // Read before inert below, which can move focus off the element.
    const active = document.activeElement;
    const hadFocus = entry.tab.contains(active) || entry.panel.contains(active);
    // While it fades out it must not take clicks or be read out again.
    entry.panel.setAttribute('inert', '');

    if (!this.entries.length) {
      // The last tab closes the box, and numbering starts again at 1.
      const box = this.box!;
      this.box = undefined;
      this.strip = undefined;
      this.selected = undefined;
      this.nextNumber = 1;
      this.removeSnackbar(box);
      return;
    }

    entry.tab.remove();
    entry.panel.remove();
    if (this.selected === entry) {
      // The neighbour on the right, or on the left if it was the last tab.
      this.select(this.entries[Math.min(index, this.entries.length - 1)]);
    } else {
      this.render();
    }
    // Focus went with the closed message's button; put it on the message
    // now shown, so a keyboard user is not dropped back to the page.
    if (hadFocus) {
      const next = this.selected!;
      const target = this.strip!.hidden ? next.panel.querySelector<HTMLElement>('.snackbar-close') : next.tab;
      target?.focus();
    }
  }

  // Brings the strip, tabs and panels in line with the open messages.
  // The strip shows once there is more than one tab, or a count to show;
  // a single message looks as a toast always has.
  private render(): void {
    const tabsShown = this.entries.length > 1 || this.entries.some(e => e.count > 1);
    this.strip!.hidden = !tabsShown;
    for (const entry of this.entries) {
      const on = entry === this.selected;
      entry.tab.setAttribute('aria-selected', String(on));
      entry.tab.tabIndex = on ? 0 : -1;
      entry.tab.setAttribute('aria-label',
        `Message ${entry.number}${entry.count > 1 ? `, shown ${entry.count} times` : ''}`);
      entry.tab.className = this.tabClasses(on, entry.error);
      entry.panel.hidden = !on;
      if (tabsShown) {
        entry.panel.setAttribute('role', 'tabpanel');
        entry.panel.setAttribute('aria-labelledby', entry.tab.id);
      } else {
        entry.panel.removeAttribute('role');
        entry.panel.removeAttribute('aria-labelledby');
      }
      if (entry.count > 1) {
        let badge = entry.tab.querySelector('.snackbar-count');
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'snackbar-count ml-1 text-xs';
          entry.tab.appendChild(badge);
        }
        badge.textContent = `×${entry.count}`;
      }
    }
  }

  // The selected tab carries its message's colour and runs into the panel
  // below it; the others sit on the darker strip and keep their kind as a
  // coloured underline, so an error among them stays visible.
  private tabClasses(selected: boolean, error: boolean): string {
    const base = 'snackbar-tab shrink-0 px-3 py-1 text-sm font-medium border-b-2 ' +
      'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white';
    if (selected) {
      return `${base} text-white ${error ? 'bg-danger-700 border-danger-700' : 'bg-gray-800 border-gray-800'}`;
    }
    return `${base} bg-gray-900 text-gray-300 hover:text-white ${error ? 'border-danger-400' : 'border-gray-500'}`;
  }

  private createTab(id: number, number: number, panelId: string): HTMLButtonElement {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.id = `snackbar-tab-${id}`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panelId);
    const label = document.createElement('span');
    label.className = 'snackbar-tab-number';
    label.textContent = String(number);
    tab.appendChild(label);
    return tab;
  }

  private createBox(): HTMLElement {
    const box = document.createElement('div');
    // The spot every toast has used, bottom centre. The min/max widths are
    // the old toast's (min-w-72, max-w-2xl), held 1rem inside each side of
    // a narrow screen.
    //
    // NOTE: bg-gray-900/text-white is a deliberate INVERSE overlay, not a
    // theme surface — a toast stays dark in both light and dark mode. Kept
    // raw (no content-* token) so the #5494 sweep doesn't flip it to a
    // light-on-light surface. The box colour shows only behind the strip;
    // each panel paints its own.
    box.className = [
      'snackbar-box', 'fixed', 'bottom-4', 'left-1/2', 'transform', '-translate-x-1/2', 'z-50',
      'min-w-[min(18rem,calc(100vw_-_2rem))]', 'max-w-[min(42rem,calc(100vw_-_2rem))]',
      'bg-gray-900', 'text-white', 'rounded-lg', 'shadow-lg', 'overflow-hidden',
      'animate-fade-in'
    ].join(' ');

    const strip = document.createElement('div');
    strip.setAttribute('role', 'tablist');
    strip.setAttribute('aria-label', 'Messages');
    // w-0 + min-w-full: the tabs never widen the box; once they no longer
    // fit, the strip scrolls sideways, and the page does not.
    strip.className = 'snackbar-tabs flex w-0 min-w-full overflow-x-auto';
    strip.hidden = true;
    // Arrow keys move along the tabs (wrapping), Home and End jump to the
    // ends; only the selected tab is in the Tab order.
    strip.addEventListener('keydown', (event: KeyboardEvent) => {
      const index = this.entries.findIndex(e => e.tab === event.target);
      if (index < 0) {
        return;
      }
      const last = this.entries.length - 1;
      const moves: Record<string, number> = {
        ArrowLeft: index === 0 ? last : index - 1,
        ArrowRight: index === last ? 0 : index + 1,
        Home: 0,
        End: last,
      };
      const to = moves[event.key];
      if (to === undefined) {
        return;
      }
      event.preventDefault();
      const entry = this.entries[to];
      this.select(entry);
      entry.tab.focus();
      // ZONELESS: Trigger change detection after user interaction
      this.appRef.tick();
    });

    box.appendChild(strip);
    document.body.appendChild(box);
    this.box = box;
    this.strip = strip;
    return box;
  }

  private createSnackbarElement(message: string, action?: string, config?: TailwindSnackBarConfig): HTMLElement {
    const snackbar = document.createElement('div');

    // Base classes. The box placed on the page is built by createBox(); this
    // is one message's panel inside it.
    //
    // items-start + whitespace-normal/break-words: previously the snackbar
    // was max-w-md (~448px) with items-center and no wrap class, so longer
    // messages (e.g. "Restaging sample-go-app on Cloud Foundry 'dup3' — org
    // 'opensource' / space 'openproject'") truncated to a single line and
    // the operator could not read what action was in flight. A wider box
    // with proper wrapping lets multi-line messages render in full while
    // keeping short ones on a single line.
    //
    // NOTE: bg-gray-800/text-white is a deliberate INVERSE overlay, not a
    // theme surface — a toast stays dark in both light and dark mode. Kept raw
    // (no content-* token) so the #5494 sweep doesn't flip it to a light-on-light
    // surface and break the white action/close text + the !bg-danger error variant.
    let classes = [
      'snackbar-panel',
      'bg-gray-800', 'text-white', 'px-6', 'py-3',
      'flex', 'items-start', 'space-x-4',
      'whitespace-normal', 'break-words',
    ];

    // Add custom classes
    if (config?.panelClass) {
      if (Array.isArray(config.panelClass)) {
        classes = classes.concat(config.panelClass);
      } else {
        classes.push(config.panelClass);
      }
    }

    snackbar.className = classes.join(' ');
    // On the red error toast the primary-blue action measured 1.02:1 and the
    // grey close 1.48:1; both go white there.
    const onRed = classes.includes('snackbar-error');

    // Create message element. whitespace-pre-line honours explicit "\n" in the
    // message (so callers can put a technical detail / error code on its own
    // line) while still wrapping normally — textContent keeps it XSS-safe.
    const messageElement = document.createElement('span');
    messageElement.textContent = message;
    messageElement.className = 'snackbar-message flex-1 whitespace-pre-line';
    snackbar.appendChild(messageElement);

    // Create action button if provided
    if (action) {
      const actionButton = document.createElement('button');
      actionButton.textContent = action;
      actionButton.className = onRed
        ? 'snackbar-action text-white underline hover:no-underline font-medium'
        : 'snackbar-action text-primary hover:text-primary/80 font-medium';
      snackbar.appendChild(actionButton);
    }

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.setAttribute('aria-label', 'Close');
    closeButton.className = `snackbar-close ${onRed ? 'text-white' : 'text-gray-400 hover:text-white'} text-xl font-bold ml-2`;
    snackbar.appendChild(closeButton);

    return snackbar;
  }

  private removeSnackbar(snackbar: HTMLElement): void {
    // While it fades out it must not take clicks meant for a new box or be
    // read out again.
    snackbar.setAttribute('inert', '');

    // Add fade out animation
    snackbar.style.transition = 'opacity 0.3s ease-out';
    snackbar.style.opacity = '0';

    setTimeout(() => {
      if (snackbar.parentNode) {
        snackbar.parentNode.removeChild(snackbar);
      }
      // ZONELESS: Trigger change detection after async DOM removal
      this.appRef.tick();
    }, 300);
  }
}
