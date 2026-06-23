import { Injectable, ComponentRef, ApplicationRef, Injector, EmbeddedViewRef, createComponent, EnvironmentInjector, Type, InjectionToken, inject } from '@angular/core';
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
  /** Let the user drag the bottom-right corner to resize the panel. The panel
   *  is pinned to a fixed viewport position so the grip tracks the cursor 1:1
   *  (a flex-centered panel would re-center and grow at half speed). */
  resizable?: boolean;
  /** Let the user move the panel by dragging an element marked with
   *  `data-dialog-drag-handle` (e.g. the dialog header). */
  draggable?: boolean;
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
  private appRef = inject(ApplicationRef);
  private injector = inject(Injector);
  private environmentInjector = inject(EnvironmentInjector);

  private openDialogs: HTMLElement[] = [];
  private static baseZIndex = 1000;

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
    (dialogRef as any).removeCallback = (_result?: R) => this.removeDialog(dialogContainer, componentRef);

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
      // Resize/drag are wired here (after first layout) so the panel can be
      // measured and pinned to a fixed viewport position.
      if (config?.resizable || config?.draggable) {
        this.setupResizableDraggable(dialogContainer, config);
      }
      dialogRef._emitOpened();
      // ZONELESS: Trigger change detection after dialog is fully opened
      this.appRef.tick();
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

    // Base classes - only include essentials, let config override sizing/overflow.
    // Note: deliberately NO `transform` / `scale-95` here. A non-`none` transform
    // on the panel creates a CSS containing block, which causes any
    // `position: fixed` overlay inside the dialog (e.g. CustomSelect's option
    // dropdown) to resolve coordinates against the dialog rather than the
    // viewport — breaking the dropdown's getBoundingClientRect-based
    // positioning. Open animation is opacity-only as a result.
    let panelClasses = [
      'bg-content-bg', 'rounded-lg', 'shadow-xl',
      'transition-opacity', 'duration-300', 'ease-out',
      'opacity-0'
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

    // Trigger opacity fade-in. Scale animation deliberately omitted; see
    // panelClasses note above re: containing-block side-effect.
    requestAnimationFrame(() => {
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
      // Close on backdrop click — but only a genuine one. A drag that starts
      // inside the dialog (resize grip, text selection) and releases on the
      // backdrop makes the browser synthesize a `click` whose target resolves
      // to the common ancestor (this overlay), which would wrongly dismiss the
      // dialog. Require the press to have ALSO started on the backdrop.
      let pressedOnBackdrop = false;
      const pointerDownListener = (event: MouseEvent) => {
        pressedOnBackdrop = event.target === dialogContainer;
      };
      const backdropClickListener = (event: MouseEvent) => {
        if (event.target === dialogContainer && pressedOnBackdrop) {
          dialogRef.close();
        }
      };
      dialogContainer.addEventListener('mousedown', pointerDownListener);
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
        dialogContainer.removeEventListener('mousedown', pointerDownListener);
        dialogContainer.removeEventListener('click', backdropClickListener);
      });
    }
  }

  /**
   * Pin the panel to a fixed viewport position and (optionally) make it
   * resizable from the bottom-right corner and movable by a drag handle.
   *
   * Fixed positioning is the key: the panel normally flex-centers over the
   * backdrop, so resizing re-centers it and the grip drifts from the cursor.
   * Anchoring it to its current spot makes the native CSS resize grip — and
   * the drag — track the pointer 1:1, and stops a resize-drag that ends on the
   * backdrop from re-centering.
   *
   * ponytail: hand-rolled mouse-drag rather than @angular/cdk's cdkDrag — the
   * panel is created imperatively (document.createElement), so an Angular
   * directive can't decorate it. Mouse events (not pointer) keep it testable
   * in jsdom, which lacks setPointerCapture.
   */
  private setupResizableDraggable(dialogContainer: HTMLElement, config: TailwindDialogConfig): void {
    const panel = dialogContainer.querySelector('[role="dialog"]') as HTMLElement;
    if (!panel) return;

    // Pin to current position so resize/drag have a stable origin. The panel
    // was flex-centered; reuse that measured rect as the fixed start point.
    const rect = panel.getBoundingClientRect();
    panel.style.position = 'fixed';
    panel.style.margin = '0';
    panel.style.left = `${rect.left}px`;
    panel.style.top = `${rect.top}px`;

    // Cap resize at the viewport edge from the panel's current top-left. Native
    // CSS resize grows down-right from the anchored corner, so a plain
    // `max-height: 90vh` still lets `top + height` spill past the bottom of the
    // viewport. Tying the max to (viewport − position) keeps the bottom-right
    // on-screen. Recomputed after a move (below), since the anchor changes.
    const clampSizeToViewport = () => {
      if (!config.resizable) return;
      const r = panel.getBoundingClientRect();
      panel.style.maxWidth = `${Math.max(0, window.innerWidth - r.left)}px`;
      panel.style.maxHeight = `${Math.max(0, window.innerHeight - r.top)}px`;
    };

    if (config.resizable) {
      panel.style.resize = 'both';
      panel.style.overflow = 'hidden';
      panel.style.minWidth = '20rem';
      panel.style.minHeight = '16rem';
      // Fill the panel so the content (e.g. a Monaco editor) grows with it.
      panel.style.display = 'flex';
      panel.style.flexDirection = 'column';
      // Make the whole chain fill: the content wrapper AND the component's own
      // host element (an extra layer between .dialog-content and the component
      // template root). The component template's root just needs `flex-1`.
      const fill = (el: HTMLElement | null) => {
        if (!el) return;
        el.style.flex = '1';
        el.style.minHeight = '0';
        el.style.display = 'flex';
        el.style.flexDirection = 'column';
      };
      const content = panel.querySelector('.dialog-content') as HTMLElement;
      fill(content);
      fill(content?.firstElementChild as HTMLElement);
    }

    clampSizeToViewport();

    if (config.draggable) {
      const handle = panel.querySelector('[data-dialog-drag-handle]') as HTMLElement;
      if (handle) {
        handle.style.cursor = 'move';
        handle.style.userSelect = 'none';
        handle.addEventListener('mousedown', (e: MouseEvent) => {
          const start = panel.getBoundingClientRect();
          const startX = e.clientX;
          const startY = e.clientY;
          const onMove = (m: MouseEvent) => {
            // Clamp to the viewport so the panel (and its action buttons) can
            // never be dragged off-screen — it's position:fixed/overflow:hidden,
            // so anything past the edge would be unreachable.
            const maxLeft = Math.max(0, window.innerWidth - panel.offsetWidth);
            const maxTop = Math.max(0, window.innerHeight - panel.offsetHeight);
            const left = Math.min(Math.max(0, start.left + m.clientX - startX), maxLeft);
            const top = Math.min(Math.max(0, start.top + m.clientY - startY), maxTop);
            panel.style.left = `${left}px`;
            panel.style.top = `${top}px`;
            clampSizeToViewport();
          };
          const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
          };
          document.addEventListener('mousemove', onMove);
          document.addEventListener('mouseup', onUp);
          e.preventDefault();
        });
      }
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
      // ZONELESS: Trigger change detection after dialog removal
      this.appRef.tick();
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