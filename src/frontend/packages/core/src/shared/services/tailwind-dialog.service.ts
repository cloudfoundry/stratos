import { Injectable, ComponentRef, Injector, EmbeddedViewRef, createComponent, EnvironmentInjector, Type, InjectionToken, ApplicationRef } from '@angular/core';
import { Subject, Observable } from 'rxjs';

// Define the MAT_DIALOG_DATA token for providing dialog data
export const MAT_DIALOG_DATA = new InjectionToken<any>('MAT_DIALOG_DATA');

// Dialog positioning options
export type DialogPosition = 'center' | 'top' | 'custom';

export interface DialogPositionConfig {
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
}

// Abstract class for dialog ref to enable DI
export abstract class TailwindDialogRef<T = any, R = any> {
  abstract afterClosed(): Observable<R | undefined>;
  abstract afterOpened(): Observable<void>;
  abstract close(dialogResult?: R): void;
  abstract componentInstance: T;
}

export interface TailwindDialogConfig<D = any> {
  data?: D;
  width?: string;
  height?: string;
  maxWidth?: string;
  maxHeight?: string;
  panelClass?: string | string[];
  backdropClass?: string | string[];
  disableClose?: boolean;
  position?: DialogPosition;
  customPosition?: DialogPositionConfig;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  id?: string;
  // Animation configuration
  animationDuration?: 'fast' | 'normal' | 'slow'; // 150ms, 250ms, 400ms
  animationType?: 'scale-fade' | 'slide-fade' | 'fade' | 'none';
  animationTiming?: 'material-standard' | 'material-deceleration' | 'material-acceleration' | 'ease-in-out';
}

export class TailwindDialogRefImpl<T = any, R = any> extends TailwindDialogRef<T, R> {
  private _afterClosed = new Subject<R | undefined>();
  private _afterOpened = new Subject<void>();
  public componentInstance: T;
  private removeCallback: (result?: R) => void;
  private _previouslyFocusedElement: HTMLElement | null = null;

  constructor(
    componentInstance: T,
    removeCallback: (result?: R) => void
  ) {
    super();
    this.componentInstance = componentInstance;
    this.removeCallback = removeCallback;
  }

  afterClosed(): Observable<R | undefined> {
    return this._afterClosed.asObservable();
  }

  afterOpened(): Observable<void> {
    return this._afterOpened.asObservable();
  }

  close(dialogResult?: R): void {
    this.removeCallback(dialogResult);
    this._afterClosed.next(dialogResult);
    this._afterClosed.complete();

    // Restore focus to previously focused element
    // Note: Focus restoration is handled by the service with appRef.tick()
    if (this._previouslyFocusedElement) {
      setTimeout(() => {
        this._previouslyFocusedElement?.focus();
      }, 0);
    }
  }

  _emitOpened(): void {
    this._afterOpened.next();
    this._afterOpened.complete();
  }

  _storePreviousFocus(): void {
    this._previouslyFocusedElement = document.activeElement as HTMLElement;
  }
}

@Injectable({
  providedIn: 'root'
})
export class TailwindDialogService {
  private openDialogs: HTMLElement[] = [];
  private static baseZIndex = 1000;

  constructor(
    private appRef: ApplicationRef,
    private injector: Injector,
    private environmentInjector: EnvironmentInjector
  ) {}

  open<T, D = any, R = any>(
    component: Type<T>,
    config?: TailwindDialogConfig<D>
  ): TailwindDialogRef<T, R> {
    // Store currently focused element for later restoration
    const dialogRef = new TailwindDialogRefImpl<T, R>(
      null as any, // Will be set after component creation
      null as any  // Will be set below
    );
    dialogRef._storePreviousFocus();

    // Create custom injector that provides MAT_DIALOG_DATA and TailwindDialogRef
    const injector = Injector.create({
      parent: this.injector,
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: config?.data || {} },
        { provide: TailwindDialogRef, useValue: dialogRef },
        { provide: 'TailwindDialogRef', useValue: dialogRef }
      ]
    });

    // Create component using modern Angular API (Angular 13+)
    const componentRef = createComponent(component, {
      environmentInjector: this.environmentInjector,
      elementInjector: injector
    });

    // Update dialog ref with component instance
    (dialogRef as any).componentInstance = componentRef.instance;

    // Create dialog container
    const dialogContainer = this.createDialogContainer(componentRef, config);

    // Set the remove callback
    (dialogRef as any).removeCallback = (result?: R) => this.removeDialog(dialogContainer, componentRef);

    // Attach component to application
    this.appRef.attachView(componentRef.hostView);

    // Add to DOM
    const domElem = (componentRef.hostView as EmbeddedViewRef<any>).rootNodes[0] as HTMLElement;
    dialogContainer.querySelector('.dialog-content')?.appendChild(domElem);
    document.body.appendChild(dialogContainer);
    this.openDialogs.push(dialogContainer);

    // Set up event listeners
    this.setupEventListeners(dialogContainer, dialogRef, config);

    // Set up focus trapping and initial focus after DOM is ready
    setTimeout(() => {
      this.setupFocusTrap(dialogContainer);
      this.focusFirstElement(dialogContainer);
      dialogRef._emitOpened();
    }, 0);

    return dialogRef;
  }

  private getAnimationClasses(config?: TailwindDialogConfig): {
    duration: string;
    timing: string;
    backdropDuration: string;
    exitDuration: number;
  } {
    // Determine animation duration
    const durationMap = {
      'fast': { duration: 'duration-150', backdropDuration: 'duration-200', exitMs: 150 },
      'normal': { duration: 'duration-300', backdropDuration: 'duration-300', exitMs: 250 },
      'slow': { duration: 'duration-500', backdropDuration: 'duration-400', exitMs: 400 }
    };

    const animDuration = config?.animationDuration || 'normal';
    const durations = durationMap[animDuration];

    // Determine timing function
    const timingMap = {
      'material-standard': 'ease-[cubic-bezier(0.4,0.0,0.2,1)]',
      'material-deceleration': 'ease-[cubic-bezier(0.0,0.0,0.2,1)]',
      'material-acceleration': 'ease-[cubic-bezier(0.4,0.0,1,1)]',
      'ease-in-out': 'ease-in-out'
    };

    const timing = timingMap[config?.animationTiming || 'material-standard'];

    return {
      duration: durations.duration,
      timing,
      backdropDuration: durations.backdropDuration,
      exitDuration: durations.exitMs
    };
  }

  private createDialogContainer<T>(componentRef: ComponentRef<T>, config?: TailwindDialogConfig): HTMLElement {
    const overlay = document.createElement('div');

    // Calculate z-index for stacking multiple dialogs
    const zIndex = TailwindDialogService.baseZIndex + (this.openDialogs.length * 10);

    // Backdrop classes with improved fade-in animation
    let backdropClasses = [
      'fixed', 'inset-0', 'bg-black', 'transition-opacity', 'duration-300', 'ease-in-out'
    ];

    if (config?.backdropClass) {
      if (Array.isArray(config.backdropClass)) {
        backdropClasses = backdropClasses.concat(config.backdropClass);
      } else {
        backdropClasses.push(config.backdropClass);
      }
    }

    // Apply positioning based on config
    const position = config?.position || 'center';
    if (position === 'center') {
      backdropClasses.push('flex', 'items-center', 'justify-center');
    } else if (position === 'top') {
      backdropClasses.push('flex', 'items-start', 'justify-center', 'pt-16');
    }

    overlay.className = backdropClasses.join(' ');
    overlay.style.zIndex = zIndex.toString();

    // Start with transparent backdrop for fade-in animation
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0)';

    // Trigger fade-in animation
    requestAnimationFrame(() => {
      overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    });

    // Dialog panel
    const dialog = document.createElement('div');

    // Base classes - only include essentials, let config override sizing/overflow
    let panelClasses = [
      'bg-white', 'dark:bg-gray-800', 'rounded-lg', 'shadow-xl',
      'transform', 'transition-all', 'duration-300', 'ease-out',
      'scale-95', 'opacity-0'
    ];

    // Add default sizing only if not provided in config
    if (!config?.width && !config?.maxWidth) {
      panelClasses.push('max-w-md', 'w-full', 'mx-4');
    }

    // Add default overflow handling only if maxHeight not specified
    if (!config?.maxHeight) {
      panelClasses.push('max-h-[90vh]', 'overflow-auto');
    }

    if (config?.panelClass) {
      if (Array.isArray(config.panelClass)) {
        panelClasses = panelClasses.concat(config.panelClass);
      } else {
        panelClasses.push(config.panelClass);
      }
    }

    dialog.className = panelClasses.join(' ');

    // Accessibility attributes
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');

    if (config?.id) {
      dialog.setAttribute('id', config.id);
    }

    if (config?.ariaLabel) {
      dialog.setAttribute('aria-label', config.ariaLabel);
    }

    if (config?.ariaLabelledBy) {
      dialog.setAttribute('aria-labelledby', config.ariaLabelledBy);
    }

    if (config?.ariaDescribedBy) {
      dialog.setAttribute('aria-describedby', config.ariaDescribedBy);
    }

    // Apply size configurations
    if (config?.width) {
      dialog.style.width = config.width;
    }
    if (config?.height) {
      dialog.style.height = config.height;
    }
    if (config?.maxWidth) {
      dialog.style.maxWidth = config.maxWidth;
    }
    if (config?.maxHeight) {
      dialog.style.maxHeight = config.maxHeight;
    }

    // Apply custom positioning
    if (position === 'custom' && config?.customPosition) {
      const pos = config.customPosition;
      if (pos.top) dialog.style.top = pos.top;
      if (pos.left) dialog.style.left = pos.left;
      if (pos.right) dialog.style.right = pos.right;
      if (pos.bottom) dialog.style.bottom = pos.bottom;
    }

    // Trigger scale-in and fade-in animation
    requestAnimationFrame(() => {
      dialog.style.transform = 'scale(1)';
      dialog.style.opacity = '1';
    });

    // Content container
    const content = document.createElement('div');
    content.className = 'dialog-content';
    dialog.appendChild(content);

    overlay.appendChild(dialog);
    return overlay;
  }

  private setupEventListeners<T, R>(
    dialogContainer: HTMLElement,
    dialogRef: TailwindDialogRefImpl<T, R>,
    config?: TailwindDialogConfig
  ): void {
    if (!config?.disableClose) {
      // Close on backdrop click
      const backdropClickListener = (event: MouseEvent) => {
        if (event.target === dialogContainer) {
          dialogRef.close();
        }
      };
      dialogContainer.addEventListener('click', backdropClickListener);

      // Close on Escape key
      const escapeListener = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          // Only close if this is the topmost dialog
          const topDialog = this.openDialogs[this.openDialogs.length - 1];
          if (topDialog === dialogContainer) {
            dialogRef.close();
          }
        }
      };
      document.addEventListener('keydown', escapeListener);

      // Clean up listeners when dialog closes
      dialogRef.afterClosed().subscribe(() => {
        document.removeEventListener('keydown', escapeListener);
        dialogContainer.removeEventListener('click', backdropClickListener);
      });
    }
  }

  private setupFocusTrap(dialogContainer: HTMLElement): void {
    const dialog = dialogContainer.querySelector('[role="dialog"]') as HTMLElement;
    if (!dialog) return;

    const focusableSelectors = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable]'
    ].join(', ');

    const keydownListener = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = Array.from(
        dialog.querySelectorAll(focusableSelectors)
      ) as HTMLElement[];

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    dialog.addEventListener('keydown', keydownListener);

    // Store listener for cleanup
    (dialog as any)._focusTrapListener = keydownListener;
  }

  private focusFirstElement(dialogContainer: HTMLElement): void {
    const dialog = dialogContainer.querySelector('[role="dialog"]') as HTMLElement;
    if (!dialog) return;

    const focusableSelectors = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable]'
    ].join(', ');

    const firstFocusable = dialog.querySelector(focusableSelectors) as HTMLElement;

    if (firstFocusable) {
      firstFocusable.focus();
    } else {
      // If no focusable element, focus the dialog itself
      dialog.setAttribute('tabindex', '-1');
      dialog.focus();
    }
  }

  private removeDialog<T>(dialogContainer: HTMLElement, componentRef: ComponentRef<T>): void {
    const index = this.openDialogs.indexOf(dialogContainer);
    if (index > -1) {
      this.openDialogs.splice(index, 1);
    }

    // Clean up focus trap listener
    const dialog = dialogContainer.querySelector('[role="dialog"]') as HTMLElement;
    if (dialog && (dialog as any)._focusTrapListener) {
      dialog.removeEventListener('keydown', (dialog as any)._focusTrapListener);
      delete (dialog as any)._focusTrapListener;
    }

    // Detach component
    this.appRef.detachView(componentRef.hostView);
    componentRef.destroy();

    // Add fade-out and scale-out animation
    const dialogPanel = dialogContainer.querySelector('[role="dialog"]') as HTMLElement;
    if (dialogPanel) {
      dialogPanel.style.transition = 'all 0.3s ease-in';
      dialogPanel.style.transform = 'scale(0.95)';
      dialogPanel.style.opacity = '0';
    }

    // Fade out backdrop
    dialogContainer.style.transition = 'background-color 0.3s ease-in';
    dialogContainer.style.backgroundColor = 'rgba(0, 0, 0, 0)';

    setTimeout(() => {
      if (dialogContainer.parentNode) {
        dialogContainer.parentNode.removeChild(dialogContainer);
      }
    }, 300);
  }

  closeAll(): void {
    this.openDialogs.forEach(dialog => {
      if (dialog.parentNode) {
        dialog.parentNode.removeChild(dialog);
      }
    });
    this.openDialogs = [];
  }
}