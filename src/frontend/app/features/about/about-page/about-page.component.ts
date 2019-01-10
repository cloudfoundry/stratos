import {
  Component,
  ComponentFactory,
  ComponentFactoryResolver,
  ComponentRef,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { Customizations, CustomizationsMetadata } from '../../../core/customizations.types';
import { AppState } from '../../../store/app-state';
import { AuthState } from '../../../store/reducers/auth.reducer';
import { SessionData } from '../../../store/types/auth.types';

@Component({
  selector: 'app-about-page',
  templateUrl: './about-page.component.html',
  styleUrls: ['./about-page.component.scss']
})
export class AboutPageComponent implements OnInit, OnDestroy {

  sessionData$: Observable<SessionData>;
  versionNumber$: Observable<string>;
  userIsAdmin$: Observable<boolean>;

  @ViewChild('supportInfoContainer', { read: ViewContainerRef }) supportInfoContainer;

  componentRef: ComponentRef<any>;

  constructor(
    private store: Store<AppState>,
    private resolver: ComponentFactoryResolver,
    @Inject(Customizations) public customizations: CustomizationsMetadata) { }
  ngOnInit() {
    this.sessionData$ = this.store.select(s => s.auth).pipe(
      filter(auth => !!(auth && auth.sessionData)),
      map((auth: AuthState) => auth.sessionData)
    );

    this.userIsAdmin$ = this.sessionData$.pipe(
      map(session => session.user && session.user.admin)
    );

    this.versionNumber$ = this.sessionData$.pipe(
      map((sessionData: SessionData) => {
        const versionNumber = sessionData.version.proxy_version;
        return versionNumber.split('-')[0];
      })
    );

    this.addSupportInfo();
  }

  ngOnDestroy() {
    if (this.componentRef) {
      this.componentRef.destroy();
    }
  }

  addSupportInfo() {
    this.supportInfoContainer.clear();
    if (this.customizations.supportInfoComponent) {
      const factory: ComponentFactory<any> = this.resolver.resolveComponentFactory(this.customizations.supportInfoComponent);
      this.componentRef = this.supportInfoContainer.createComponent(factory);
    }
  }
}
