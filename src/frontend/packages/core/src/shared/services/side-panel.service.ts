import { DOCUMENT } from '@angular/common';
import {
  type ComponentFactory,
  ComponentFactoryResolver,
  type ComponentRef,
  Inject,
  Injectable,
  type Type,
  type ViewContainerRef,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { filter, tap } from 'rxjs/operators';

// Side Panel Modes
export enum SidePanelMode {
  // Modal = spans the full height of the window and overlaps the title bar
  Modal = 0,
  // Normal = 600px width and height not overlapping title bar
  Normal = 1,
  // Narrow = 400px width and height not overlapping title bar
  Narrow = 2,
}

/**
 * Service to allow the overlay side panel to be shown or hidden.
 *
 * Supports two modes:
 *  - with show(...) - Brings in side panel below the top nav
 *  - with showModal(...) - Brings in side panel overlaying the top nav
 */
@Injectable({
  providedIn: 'root'
})
export class SidePanelService {
  private _opened = signal<boolean>(false);
  public opened = this._opened.asReadonly();

  private _previewMode = signal<SidePanelMode>(SidePanelMode.Normal);
  public previewMode = this._previewMode.asReadonly();

  private container: ViewContainerRef;

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private router: Router,
    @Inject(DOCUMENT) private document: Document,
  ) {
    this.setupRouterListener();
  }

  public unsetContainer() {
    this.container = undefined;
  }

  public setContainer(container: ViewContainerRef) {
    if (this.container) {
      throw new Error('SidePanelService: container already set');
    }

    this.container = container;
  }

  /**
   * Show the preview panel in the given mode
   */
  public showMode(
    mode: SidePanelMode, component: object, props?: { [key: string]: unknown }, componentFactoryResolver?: ComponentFactoryResolver) {
    if (!this.container) {
      throw new Error('SidePanelService: container must be set');
    }

    this.render(component, props, componentFactoryResolver);
    this._previewMode.set(mode);
    this.open();
  }

  /**
   * Show the preview panel in a preview style - does not overlap title bar and colours are more muted
   */
  public show(component: object, props?: { [key: string]: unknown }, componentFactoryResolver?: ComponentFactoryResolver) {
    this.showMode(SidePanelMode.Normal, component, props, componentFactoryResolver);
  }

  /**
   * Show the preview panel in a modal style - full height overlaps title bar
   */
  public showModal(component: object, props?: { [key: string]: unknown }, componentFactoryResolver?: ComponentFactoryResolver) {
    this.showMode(SidePanelMode.Modal, component, props, componentFactoryResolver);
  }

  // Re-open the panel with its current contents
  public open() {
    this._opened.set(true);
    this.document.addEventListener('keydown', this.onKeyDown);
  }

  public hide() {
    if (!this.container) {
      throw new Error('SidePanelService: container must be set');
    }

    this._opened.set(false);
    this.document.removeEventListener('keydown', this.onKeyDown);
  }

  onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      this.hide();
    }
  }

  render(
    component: object,
    props: { [key: string]: unknown },
    componentFactoryResolver: ComponentFactoryResolver = this.componentFactoryResolver
  ) {
    if (this.container.length) {
      this.container.remove(0);
    }

    const factory: ComponentFactory<unknown> = componentFactoryResolver.resolveComponentFactory(component as Type<unknown>);
    const componentRef: ComponentRef<unknown> = this.container.createComponent(factory);

    if (props) {
      (componentRef.instance as { setProps?: (p: Record<string, unknown>) => void }).setProps?.(props);
    }
  }

  public clear() {
    this.container.clear();
    this._opened.set(false);
  }

  private setupRouterListener() {
    this.router.events.pipe(
      filter(() => !!this.container),
      tap((_e) => this.hide()))
      .subscribe();
  }
}
