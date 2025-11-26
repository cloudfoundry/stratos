import {Component, type OnInit, inject, } from '@angular/core';
import { Store } from '@ngrx/store';
import type { AppState } from '@stratosui/store';
import { endpointOfTypeSelector } from '@stratosui/store';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ListComponent, ListConfig, PageHeaderComponent, NoContentMessageComponent } from '@stratosui/core';
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
