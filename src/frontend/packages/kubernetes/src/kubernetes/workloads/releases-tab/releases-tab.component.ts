import {Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '@stratosui/store';
import { endpointOfTypeSelector } from '@stratosui/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ListComponent } from '../../../../../core/src/shared/components/list/list.component';
import { ListConfig } from '../../../../../core/src/shared/components/list/list.component.types';
import { PageHeaderComponent } from '../../../../../core/src/shared/components/page-header/page-header.component';
import { NoContentMessageComponent } from '../../../../../core/src/shared/components/no-content-message/no-content-message.component';
import { HELM_ENDPOINT_TYPE } from '../../../helm/helm-entity-factory';
import { HelmReleasesListConfig } from '../list-types/helm-releases-list-config.service';
import { KubernetesNamespacesFilterService } from '../list-types/kube-namespaces-filter-config.service';

@Component({
selector: 'app-releases-tab',
  templateUrl: './releases-tab.component.html',
  styleUrls: ['./releases-tab.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: HelmReleasesListConfig,
    },
    KubernetesNamespacesFilterService,
  ],
  standalone: true,
  imports: [
    ListComponent,
    PageHeaderComponent,
    NoContentMessageComponent
  ]
})
export class HelmReleasesTabComponent implements OnInit {
  public helmIds$: Observable<string[]>;
  private store = inject(Store<AppState>);

  ngOnInit() {
    this.helmIds$ = this.store.select(endpointOfTypeSelector(HELM_ENDPOINT_TYPE)).pipe(
      map(endpoints => Object.keys(endpoints)),
    );
  }
}
