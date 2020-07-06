import { DOCUMENT } from '@angular/common';
import {
  ComponentFactory,
  ComponentFactoryResolver,
  ComponentRef,
  Inject,
  Injectable,
  ViewContainerRef,
} from '@angular/core';
import { Router } from '@angular/router';
import { asapScheduler, BehaviorSubject, Observable, Subject } from 'rxjs';
import { filter, observeOn, publishReplay, refCount, tap } from 'rxjs/operators';

/**
 * Service to allow the overlay side panel to be shown or hidden.
 *
 * Supports two modes:
 *  - with show(...) - Brings in side panel below the top nav
 *  - with showModal(...) - Brings in side panel overlaying the top nav
 */
@Injectable()
export class SidePanelService {
  private openedSubject: BehaviorSubject<boolean>;
  public opened$: Observable<boolean>;

  private previewModeSubject: BehaviorSubject<boolean>;
  public previewMode$: Observable<boolean>;

  private container: ViewContainerRef;

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private router: Router,
    @Inject(DOCUMENT) private document: Document,
  ) {
    this.openedSubject = new BehaviorSubject(false);
    this.opened$ = this.observeSubject(this.openedSubject);

    this.previewModeSubject = new BehaviorSubject(false);
    this.previewMode$ = this.observeSubject(this.previewModeSubject);

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
   * Show the preview panel in a preview style - does not overlap title bar and colours are more muted
   */
  public show(component: object, props?: { [key: string]: any }, componentFactoryResolver?: ComponentFactoryResolver) {
    if (!this.container) {
      throw new Error('SidePanelService: container must be set');
    }

    this.render(component, props, componentFactoryResolver);
    this.previewModeSubject.next(true);
    this.open();
  }

  /**
   * Show the preview panel in a modal style - full height overlaps title bar
   */
  public showModal(component: object, props?: { [key: string]: any }, componentFactoryResolver?: ComponentFactoryResolver) {
    if (!this.container) {
      throw new Error('SidePanelService: container must be set');
    }

    this.render(component, props, componentFactoryResolver);
    this.previewModeSubject.next(false);
    this.open();
  }

  private open() {
    this.openedSubject.next(true);
    this.document.addEventListener('keydown', this.onKeyDown);
  }

  public hide() {
    if (!this.container) {
      throw new Error('SidePanelService: container must be set');
    }

    this.openedSubject.next(false);
    this.document.removeEventListener('keydown', this.onKeyDown);
  }

  onKeyDown = (event) => {
    if (event.key === 'Escape') {
      this.hide();
    }
  }

  render(
    component: object,
    props: { [key: string]: any },
    componentFactoryResolver: ComponentFactoryResolver = this.componentFactoryResolver
  ) {
    if (this.container.length) {
      this.container.remove(0);
    }

    const factory: ComponentFactory<any> = componentFactoryResolver.resolveComponentFactory(component as any);
    const componentRef: ComponentRef<any> = this.container.createComponent(factory);

    if (props) {
      componentRef.instance.setProps(props);
    }
  }

  public clear() {
    this.container.clear();
    this.openedSubject.next(false);
  }

  private setupRouterListener() {
    this.router.events.pipe(
      filter(() => !!this.container),
      tap((e) => this.hide()))
      .subscribe();
  }

  private observeSubject(subject: Subject<any>) {
    return subject.asObservable().pipe(
      publishReplay(1),
      refCount(),
      observeOn(asapScheduler)
    );
  }
}
