import { ComponentFactory, ComponentFactoryResolver, ComponentRef, Injectable, ViewContainerRef } from '@angular/core';
import { asapScheduler, BehaviorSubject, Observable, Subject } from 'rxjs';
import { observeOn, publishReplay, refCount } from 'rxjs/operators';

@Injectable()
export class PanelPreviewService {
  private openedSubject: BehaviorSubject<boolean>;
  public opened$: Observable<boolean>;

  private container: ViewContainerRef;

  constructor(private componentFactoryResolver: ComponentFactoryResolver) {
    this.openedSubject = new BehaviorSubject(false);
    this.opened$ = this.observeSubject(this.openedSubject);
  }

  public setContainer(container: ViewContainerRef) {
    if (this.container) {
      throw new Error('PanelPreviewService: container already set');
    }

    this.container = container;
  }

  public show(component: object, props?: { [key: string]: any }) {
    if (!this.container) {
      throw new Error('PanelPreviewService: container must be set');
    }

    this.render(component, props);
    this.openedSubject.next(true);
  }

  public hide() {
    if (!this.container) {
      throw new Error('PanelPreviewService: container must be set');
    }

    this.openedSubject.next(false);
  }

  render(component: object, props: { [key: string]: any }) {
    if (this.container.length) {
      this.container.remove(0);
    }

    const factory: ComponentFactory<any> = this.componentFactoryResolver.resolveComponentFactory(component as any);
    const componentRef: ComponentRef<any> = this.container.createComponent(factory);

    if (props) {
      componentRef.instance.setProps(props);
    }
  }

  public clear() {
    this.container.clear();
    this.openedSubject.next(false);
  }

  private observeSubject(subject: Subject<any>) {
    return subject.asObservable().pipe(
      publishReplay(1),
      refCount(),
      observeOn(asapScheduler)
    );
  }
}
