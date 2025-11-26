import { CommonModule, AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component,
  type ComponentFactory,
  ComponentFactoryResolver,
  type ComponentRef,
  type OnDestroy,
  type OnInit,
  ViewChild,
  ViewContainerRef,
  inject,
 } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import type {GeneralEntityAppState} from '@stratosui/store';
import type {AuthState, SessionData} from '@stratosui/store';
import type { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import {CustomizationService, type CustomizationsMetadata} from '../../../core/customizations.types';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StratosTitleComponent } from '../../../shared/components/stratos-title/stratos-title.component';
import { ProductNameComponent } from '../../../shared/components/product-name.component';
import { MetadataItemComponent } from '../../../shared/components/metadata-item/metadata-item.component';

@Component({
  selector: 'app-about-page',
  templateUrl: './about-page.component.html',
  styleUrls: ['./about-page.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PageHeaderComponent,
    StratosTitleComponent,
    ProductNameComponent,
    MetadataItemComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AboutPageComponent implements OnInit, OnDestroy {

  sessionData$!: Observable<SessionData>;
  versionNumber$!: Observable<string>;
  userIsAdmin$!: Observable<boolean>;

  @ViewChild('aboutInfoContainer', { read: ViewContainerRef, static: true }) aboutInfoContainer!: ViewContainerRef;
  @ViewChild('supportInfoContainer', { read: ViewContainerRef, static: true }) supportInfoContainer!: ViewContainerRef;

  aboutInfoComponentRef!: ComponentRef<unknown>;
  componentRef!: ComponentRef<unknown>;

  customizations: CustomizationsMetadata;

  private store = inject(Store<GeneralEntityAppState>);
  private resolver = inject(ComponentFactoryResolver);

  constructor(
    cs: CustomizationService,
  ) {
    this.customizations = cs.get();
  }

  ngOnInit() {
    this.sessionData$ = this.store.select(s => s.auth).pipe(
      filter(auth => !!(auth?.sessionData)),
      map((auth: AuthState) => auth.sessionData)
    );

    this.userIsAdmin$ = this.sessionData$.pipe(
      map(session => session.user?.admin)
    );

    this.versionNumber$ = this.sessionData$.pipe(
      map((sessionData: SessionData) => {
        const versionNumber = sessionData.version.proxy_version;
        return versionNumber.split('-')[0];
      })
    );

    this.addAboutInfoComponent();
    this.addSupportInfo();
  }

  ngOnDestroy() {
    if (this.aboutInfoComponentRef) {
      this.aboutInfoComponentRef.destroy();
    }
    if (this.componentRef) {
      this.componentRef.destroy();
    }
  }

  addAboutInfoComponent() {
    this.aboutInfoContainer.clear();
    if (this.customizations.aboutInfoComponent) {
      const factory: ComponentFactory<unknown> = this.resolver.resolveComponentFactory(this.customizations.aboutInfoComponent);
      this.aboutInfoComponentRef = this.aboutInfoContainer.createComponent(factory);
    }
  }

  addSupportInfo() {
    this.supportInfoContainer.clear();
    if (this.customizations.supportInfoComponent) {
      const factory: ComponentFactory<unknown> = this.resolver.resolveComponentFactory(this.customizations.supportInfoComponent);
      this.componentRef = this.supportInfoContainer.createComponent(factory);
    }
  }
}
