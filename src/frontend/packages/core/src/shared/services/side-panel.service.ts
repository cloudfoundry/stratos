import { DOCUMENT } from '@angular/common';
import { ComponentRef, Injectable, ViewContainerRef, signal, inject } from '@angular/core';
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
  private router = inject(Router);
  private document = inject<Document>(DOCUMENT);

  private _opened = signal<boolean>(false);
  public opened = this._opened.asReadonly();

  private _previewMode = signal<SidePanelMode>(SidePanelMode.Normal);
  public previewMode = this._previewMode.asReadonly();

  // Absent until a host component registers via setContainer, and cleared
  // again by unsetContainer; methods guard before use.
  private container: ViewContainerRef | undefined;

  constructor() {
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
    mode: SidePanelMode, component: object, props?: { [key: string]: any }) {
    if (!this.container) {
      throw new Error('SidePanelService: container must be set');
    }

    this.render(component, props);
    this._previewMode.set(mode);
    this.open();
  }

  /**
   * Show the preview panel in a preview style - does not overlap title bar and colours are more muted
   */
  public show(component: object, props?: { [key: string]: any }) {
    this.showMode(SidePanelMode.Normal, component, props);
  }

  /**
   * Show the preview panel in a modal style - full height overlaps title bar
   */
  public showModal(component: object, props?: { [key: string]: any }) {
    this.showMode(SidePanelMode.Modal, component, props);
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
    props?: { [key: string]: any },
  ) {
    if (!this.container) {
      throw new Error('SidePanelService: container must be set');
    }

    if (this.container.length) {
      this.container.remove(0);
    }

    const componentRef: ComponentRef<any> = this.container.createComponent(component as any);

    if (props) {
      componentRef.instance.setProps(props);
    }
  }

  public clear() {
    if (!this.container) {
      throw new Error('SidePanelService: container must be set');
    }

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
