import { ComponentFactory, ComponentFactoryResolver, ComponentRef, Injectable, ViewContainerRef, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { asapScheduler, BehaviorSubject, Observable, Subject } from 'rxjs';
import { filter, observeOn, publishReplay, refCount, tap } from 'rxjs/operators';
import { DOCUMENT } from '@angular/common';

@Injectable()
export class PanelPreviewService {
  private openedSubject: BehaviorSubject<boolean>;
  public opened$: Observable<boolean>;

  private container: ViewContainerRef;

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private router: Router,
    @Inject(DOCUMENT) private document: Document,
  ) {
    this.openedSubject = new BehaviorSubject(false);
    this.opened$ = this.observeSubject(this.openedSubject);

    this.setupRouterListener();
  }

  public setContainer(container: ViewContainerRef) {
    if (this.container) {
      throw new Error('PanelPreviewService: container already set');
    }

    this.container = container;
  }

  public show(component: object, props?: { [key: string]: any }, componentFactoryResolver?: ComponentFactoryResolver) {
    if (!this.container) {
      throw new Error('PanelPreviewService: container must be set');
    }

    this.render(component, props, componentFactoryResolver);
    this.openedSubject.next(true);

    this.document.addEventListener('keydown', this.onKeyDown);
  }

  onKeyDown = (event) => {
    if (event.key === 'Escape') {
      this.hide();
    }
  }

  public hide() {
    if (!this.container) {
      throw new Error('PanelPreviewService: container must be set');
    }

    this.openedSubject.next(false);
    this.document.removeEventListener('keydown', this.onKeyDown);

  }

  render(component: object, props: { [key: string]: any }, componentFactoryResolver?: ComponentFactoryResolver) {
    if (this.container.length) {
      this.container.remove(0);
    }

    // Use the supplied component factory resolver if provided
    const resolver = componentFactoryResolver ||  this.componentFactoryResolver;

    const factory: ComponentFactory<any> = resolver.resolveComponentFactory(component as any);
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
