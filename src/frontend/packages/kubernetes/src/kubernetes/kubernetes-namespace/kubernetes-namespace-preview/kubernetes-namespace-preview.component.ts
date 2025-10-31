import {Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppState } from '@stratosui/store';
import { Observable } from 'rxjs';

import { PreviewableComponent } from '../../../../../core/src/shared/previewable-component';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';
import { KubernetesNamespaceService } from '../../services/kubernetes-namespace.service';
import { KubernetesAnalysisService } from '../../services/kubernetes.analysis.service';
import { KubernetesService } from '../../services/kubernetes.service';

@Component({
  selector: 'app-kubernetes-namespace-preview',
  templateUrl: './kubernetes-namespace-preview.component.html',
  styleUrls: ['./kubernetes-namespace-preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  providers: [
    {
      provide: BaseKubeGuid,
      useFactory: (activatedRoute: ActivatedRoute) => {
        return {
          guid: activatedRoute.snapshot.params.endpointId
        };
      },
      deps: [
        ActivatedRoute
      ]
    },
    KubernetesService,
    KubernetesEndpointService,
    KubernetesNamespaceService,
    KubernetesAnalysisService,
  ]
})
export class KubernetesNamespacePreviewComponent implements PreviewableComponent {

  showAnalysis$: Observable<boolean>;

  link: string;
  private store = inject(Store<AppState>);



  constructor() {


    this.showAnalysis$ = KubernetesAnalysisService.isAnalysisEnabled(this.store);


  }

  setProps(props: { [key: string]: any; }): void {
    const { resource, endpointId } = props;
    this.link = `/kubernetes/${endpointId}/resource/namespace/${resource.metadata.name}/analysis`;
  }
}
