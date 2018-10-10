import { Component, OnInit, Injector } from '@angular/core';

import { ListConfig } from '../../../../shared/components/list/list.component.types';
import {
  KubernetesNamespacePodsListConfigService
 } from '../../list-types/kubernetes-namespace-pods/kubernetes-namespace-pods-list-config.service';
import { KubernetesNamespaceService } from '../../services/kubernetes-namespace.service';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../store/app-state';
import { EndpointsService } from '../../../../core/endpoints.service';
import { first } from 'rxjs/operators';
import { PodNameLinkComponent } from '../../list-types/kubernetes-pods/pod-name-link/pod-name-link.component';

@Component({
  selector: 'app-kubernetes-namespace-pods',
  templateUrl: './kubernetes-namespace-pods.component.html',
  styleUrls: ['./kubernetes-namespace-pods.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: KubernetesNamespacePodsListConfigService,
  }]
})
export class KubernetesNamespacePodsComponent implements OnInit {

  listConfig = null;

  constructor(
    private store: Store<AppState>,
    private kubeNamespaceService: KubernetesNamespaceService,
    private kubeGuid: BaseKubeGuid,
    private endpointsService: EndpointsService
  ) { }

  ngOnInit() {
    // Make the pod name clickable only if we have metrics available
    this.endpointsService.hasMetrics(this.kubeGuid.guid).pipe(
      first()
    ).subscribe(hasMetrics => {
      const config = new KubernetesNamespacePodsListConfigService(
        this.store, this.kubeGuid, this.kubeNamespaceService);

      if (hasMetrics) {
        config.columns[0].cellComponent = PodNameLinkComponent;
        config.columns[0].cellDefinition = null;
      } else {
        config.columns[0].cellComponent = null;
        config.columns[0].cellDefinition = {
          getValue: (row) => {
            return row.metadata.name;
          }
        };
      }

      this.listConfig = config;
    });
  }
}
