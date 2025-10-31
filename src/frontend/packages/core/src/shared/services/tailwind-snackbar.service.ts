import { Injectable, ComponentRef, ApplicationRef, Injector, EmbeddedViewRef, inject } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface TailwindSnackBarConfig {
  duration?: number;
  action?: string;
  panelClass?: string | string[];
}

export interface TailwindSnackBarRef<T> {
  afterDismissed(): Observable<any>;
  onAction(): Observable<any>;
  dismiss(): void;
  dismissWithAction(): void;
}

export class TailwindSnackBarRefImpl<T> implements TailwindSnackBarRef<T> {
  private _afterDismissed = new Subject<any>();
  private _onAction = new Subject<any>();

  constructor(private removeCallback: () => void) {}

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

  open(message: string, action?: string, config?: TailwindSnackBarConfig): TailwindSnackBarRef<any> {
    const snackbarElement = this.createSnackbarElement(message, action, config);
    const snackbarRef = new TailwindSnackBarRefImpl(() => this.removeSnackbar(snackbarElement));

    // Add to DOM
    document.body.appendChild(snackbarElement);
    this.snackbars.push(snackbarElement);

    // Auto dismiss
    const duration = config?.duration || 4000;
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
    let classes = [
      'fixed', 'bottom-4', 'left-1/2', 'transform', '-translate-x-1/2',
      'bg-gray-800', 'text-white', 'px-6', 'py-3', 'rounded-lg', 'shadow-lg',
      'flex', 'items-center', 'space-x-4', 'z-50', 'min-w-72', 'max-w-md',
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

    // Create message element
    const messageElement = document.createElement('span');
    messageElement.textContent = message;
    messageElement.className = 'flex-1';
    snackbar.appendChild(messageElement);

    // Create action button if provided
    if (action) {
      const actionButton = document.createElement('button');
      actionButton.textContent = action;
      actionButton.className = 'snackbar-action text-blue-400 hover:text-blue-300 font-medium';
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