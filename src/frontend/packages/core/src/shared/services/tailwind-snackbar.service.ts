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

@Injectable({
  providedIn: 'root'
})
export class TailwindSnackBarService {
  private snackbars: HTMLElement[] = [];

  private appRef = inject(ApplicationRef);
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
      panelClass: ['snackbar-error', '!bg-danger']
        .concat(config?.panelClass ? (Array.isArray(config.panelClass) ? config.panelClass : [config.panelClass]) : []),
    });
  }

  open(message: string, action?: string, config?: TailwindSnackBarConfig): TailwindSnackBarRef<any> {
    const snackbarElement = this.createSnackbarElement(message, action, config);
    const snackbarRef = new TailwindSnackBarRefImpl(
      () => this.removeSnackbar(snackbarElement),
      (message: string) => {
        const el = snackbarElement.querySelector('.snackbar-message');
        if (el) { el.textContent = message; }
        // ZONELESS: keep parity with the other DOM mutations in this service
        this.appRef.tick();
      },
    );

    // Add to DOM
    document.body.appendChild(snackbarElement);
    this.snackbars.push(snackbarElement);

    // Auto dismiss. Use ?? instead of || so that an explicit `duration: 0`
    // from the caller means "do not auto-dismiss" (the standard convention)
    // rather than being treated as falsy and falling back to the 4s default.
    // Previously, callers that wanted a persistent error snackbar (e.g. the
    // stepper's "Dismiss" action) had their explicit `duration: 0` silently
    // overridden, causing the error to pop up and disappear before the user
    // could read it. This `duration: 0` = stay-until-dismissed rule mirrors
    // Angular Material's MatSnackBar, so callers coming from Material get it.
    const duration = config?.duration ?? 4000;
    if (duration > 0) {
      setTimeout(() => {
        snackbarRef.dismiss();
        // ZONELESS: Trigger change detection after async operation
        this.appRef.tick();
      }, duration);
    }

    // Add event listeners
    const actionButton = snackbarElement.querySelector('.snackbar-action');
    if (actionButton) {
      actionButton.addEventListener('click', () => {
        snackbarRef.dismissWithAction();
        // ZONELESS: Trigger change detection after user interaction
        this.appRef.tick();
      });
    }

    const closeButton = snackbarElement.querySelector('.snackbar-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        snackbarRef.dismiss();
        // ZONELESS: Trigger change detection after user interaction
        this.appRef.tick();
      });
    }

    return snackbarRef;
  }

  dismiss(): void {
    // Dismiss all current snackbars
    this.snackbars.forEach(snackbar => {
      this.removeSnackbar(snackbar);
    });
  }

  private createSnackbarElement(message: string, action?: string, config?: TailwindSnackBarConfig): HTMLElement {
    const snackbar = document.createElement('div');

    // Base classes
    //
    // max-w-2xl + items-start + whitespace-normal/break-words: previously the
    // snackbar was max-w-md (~448px) with items-center and no wrap class, so
    // longer messages (e.g. "Restaging sample-go-app on Cloud Foundry 'dup3'
    // — org 'opensource' / space 'openproject'") truncated to a single line
    // and the operator could not read what action was in flight. Switching
    // to a wider container with proper wrapping lets multi-line messages
    // render in full while keeping short ones on a single line.
    //
    // ponytail: bg-gray-800/text-white is a deliberate INVERSE overlay, not a
    // theme surface — a toast stays dark in both light and dark mode. Kept raw
    // (no content-* token) so the #5494 sweep doesn't flip it to a light-on-light
    // surface and break the white action/close text + the !bg-danger error variant.
    let classes = [
      'fixed', 'bottom-4', 'left-1/2', 'transform', '-translate-x-1/2',
      'bg-gray-800', 'text-white', 'px-6', 'py-3', 'rounded-lg', 'shadow-lg',
      'flex', 'items-start', 'space-x-4', 'z-50', 'min-w-72', 'max-w-2xl',
      'whitespace-normal', 'break-words',
      'animate-fade-in'
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
      actionButton.className = 'snackbar-action text-primary hover:text-primary/80 font-medium';
      snackbar.appendChild(actionButton);
    }

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.className = 'snackbar-close text-gray-400 hover:text-white text-xl font-bold ml-2';
    snackbar.appendChild(closeButton);

    return snackbar;
  }

  private removeSnackbar(snackbar: HTMLElement): void {
    const index = this.snackbars.indexOf(snackbar);
    if (index > -1) {
      this.snackbars.splice(index, 1);
    }

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