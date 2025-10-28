import { Injectable, ComponentRef, ApplicationRef, Injector, EmbeddedViewRef, createComponent, EnvironmentInjector, Type, InjectionToken } from '@angular/core';
import { Subject, Observable } from 'rxjs';

// Define the MAT_DIALOG_DATA token for providing dialog data
export const MAT_DIALOG_DATA = new InjectionToken<any>('MAT_DIALOG_DATA');

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
}

export class TailwindDialogRefImpl<T = any, R = any> extends TailwindDialogRef<T, R> {
  private _afterClosed = new Subject<R | undefined>();
  private _afterOpened = new Subject<void>();
  public componentInstance: T;
  private removeCallback: (result?: R) => void;

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
  }

  _emitOpened(): void {
    this._afterOpened.next();
    this._afterOpened.complete();
  }
}

@Injectable({
  providedIn: 'root'
})
export class TailwindDialogService {
  private openDialogs: HTMLElement[] = [];

  constructor(
    private appRef: ApplicationRef,
    private injector: Injector,
    private environmentInjector: EnvironmentInjector
  ) {}

  open<T, D = any, R = any>(
    component: Type<T>,
    config?: TailwindDialogConfig<D>
  ): TailwindDialogRef<T, R> {
    // Create dialog ref first so we can provide it via DI
    const dialogRef = new TailwindDialogRefImpl<T, R>(
      null as any, // Will be set after component creation
      null as any  // Will be set below
    );

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

    // Emit opened event
    setTimeout(() => dialogRef._emitOpened(), 0);

    return dialogRef;
  }

  private createDialogContainer<T>(componentRef: ComponentRef<T>, config?: TailwindDialogConfig): HTMLElement {
    const overlay = document.createElement('div');

    // Backdrop classes
    let backdropClasses = [
      'fixed', 'inset-0', 'bg-black', 'bg-opacity-50', 'z-50',
      'flex', 'items-center', 'justify-center', 'animate-fade-in'
    ];

    if (config?.backdropClass) {
      if (Array.isArray(config.backdropClass)) {
        backdropClasses = backdropClasses.concat(config.backdropClass);
      } else {
        backdropClasses.push(config.backdropClass);
      }
    }

    overlay.className = backdropClasses.join(' ');

    // Dialog panel
    const dialog = document.createElement('div');
    let panelClasses = [
      'bg-white', 'dark:bg-gray-800', 'rounded-lg', 'shadow-xl',
      'max-w-md', 'w-full', 'mx-4', 'max-h-96vh', 'overflow-auto',
      'transform', 'scale-95', 'animate-scale-in'
    ];

    if (config?.panelClass) {
      if (Array.isArray(config.panelClass)) {
        panelClasses = panelClasses.concat(config.panelClass);
      } else {
        panelClasses.push(config.panelClass);
      }
    }

    dialog.className = panelClasses.join(' ');

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
    // Close on backdrop click
    if (!config?.disableClose) {
      dialogContainer.addEventListener('click', (event) => {
        if (event.target === dialogContainer) {
          dialogRef.close();
        }
      });

      // Close on Escape key
      const escapeListener = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          dialogRef.close();
          document.removeEventListener('keydown', escapeListener);
        }
      };
      document.addEventListener('keydown', escapeListener);
    }
  }

  private removeDialog<T>(dialogContainer: HTMLElement, componentRef: ComponentRef<T>): void {
    const index = this.openDialogs.indexOf(dialogContainer);
    if (index > -1) {
      this.openDialogs.splice(index, 1);
    }

    // Detach component
    this.appRef.detachView(componentRef.hostView);
    componentRef.destroy();

    // Add fade out animation
    dialogContainer.style.transition = 'opacity 0.3s ease-out';
    dialogContainer.style.opacity = '0';

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