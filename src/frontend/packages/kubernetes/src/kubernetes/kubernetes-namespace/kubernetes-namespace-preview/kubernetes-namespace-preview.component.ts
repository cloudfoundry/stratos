import { AsyncPipe } from "@angular/common";
import { Component, inject, ChangeDetectionStrategy } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { Observable } from "rxjs";

import { PreviewableComponent } from "../../../../../core/src/shared/previewable-component";
import { SessionService } from "../../../../../core/src/core/session.service";
import { BaseKubeGuid } from "../../kubernetes-page.types";
import { KubernetesEndpointService } from "../../services/kubernetes-endpoint.service";
import { KubernetesNamespaceService } from "../../services/kubernetes-namespace.service";
import { KubernetesAnalysisService } from "../../services/kubernetes.analysis.service";
import { KubernetesService } from "../../services/kubernetes.service";

@Component({
  selector: "app-kubernetes-namespace-preview",
  templateUrl: "./kubernetes-namespace-preview.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [AsyncPipe, RouterLink],
  providers: [
    {
      provide: BaseKubeGuid,
      useFactory: (activatedRoute: ActivatedRoute) => {
        return {
          guid: activatedRoute.snapshot.params.endpointId,
        };
      },
      deps: [ActivatedRoute],
    },
    KubernetesService,
    KubernetesEndpointService,
    KubernetesNamespaceService,
    KubernetesAnalysisService,
  ],
})
export class KubernetesNamespacePreviewComponent implements PreviewableComponent {
  showAnalysis$: Observable<boolean>;

  link: string;
  private session = inject(SessionService);

  constructor() {
    this.showAnalysis$ = KubernetesAnalysisService.isAnalysisEnabled(
      this.session,
    );
  }

  setProps(props: { [key: string]: any }): void {
    const { resource, endpointId } = props;
    this.link = `/kubernetes/${endpointId}/resource/namespace/${resource.metadata.name}/analysis`;
  }
}
