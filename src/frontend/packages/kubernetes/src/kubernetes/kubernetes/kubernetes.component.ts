import { CommonModule } from "@angular/common";
import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  ChangeDetectionStrategy,
} from "@angular/core";
import { toObservable } from "@angular/core/rxjs-interop";
import { Router } from "@angular/router";
import { Observable } from "rxjs";
import { take, filter, map } from "rxjs/operators";

import { SignalListComponent } from "@stratosui/core";

import { EndpointsSignalService } from "../../../../core/src/core/signals/endpoints-signal.service";
import { DuplicateUrlBannerComponent } from "../../../../core/src/shared/components/duplicate-url-banner/duplicate-url-banner.component";
import { PageHeaderComponent } from "../../../../core/src/shared/components/page-header/page-header.component";
import { EndpointModel } from "../../../../store/src/public-api";
import { KUBERNETES_ENDPOINT_TYPE } from "../kubernetes-entity-factory";
import { KubernetesEndpointsSignalConfigService } from "../list-types/kubernetes-endpoints/kubernetes-endpoints-signal-config.service";
import { KubernetesService } from "../services/kubernetes.service";

@Component({
  selector: "app-kubernetes",
  templateUrl: "./kubernetes.component.html",

  providers: [KubernetesService],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    PageHeaderComponent,
    SignalListComponent,
    DuplicateUrlBannerComponent,
  ],
})
export class KubernetesComponent implements OnInit, OnDestroy {
  connectedEndpoints$: Observable<number>;
  connectedKubeEndpoints$: Observable<EndpointModel[]>;
  private kubeService = inject(KubernetesService);
  private router = inject(Router);
  private endpointsSignals = inject(EndpointsSignalService);
  // Wave-3: signal-native list config. The service is now a true
  // SignalListConfig orchestrator — no `Store` import, no
  // BaseEndpointsDataSource.
  readonly endpointsSignalConfig = inject(
    KubernetesEndpointsSignalConfigService,
  );

  // Connected k8s endpoints for the duplicate-URL banner — scoped to k8s so
  // it never mentions unrelated CF/helm duplicates on this page.
  private readonly connectedKubeEndpoints = computed(() =>
    this.endpointsSignals.connectedEndpoints().filter(ep => ep?.cnsi_type === KUBERNETES_ENDPOINT_TYPE),
  );

  constructor() {
    this.connectedKubeEndpoints$ = toObservable(this.connectedKubeEndpoints);
    this.connectedEndpoints$ = this.kubeService.kubeEndpoints$.pipe(
      map((kubeEndpoints) => {
        // 'expired' deliberately excluded: a dead-token endpoint must not
        // count as the "one connected endpoint" that triggers the
        // auto-navigate below — entering it would just land on a broken view.
        const connectedEndpoints = kubeEndpoints.filter(
          (c) => c.connectionStatus === "connected",
        );
        const hasOne = connectedEndpoints.length === 1;
        if (hasOne) {
          // Single connected endpoint → auto-navigate into its detail
          // page. Was previously a `RouterNav` ngrx action — flipped to
          // the Angular Router directly so this component sheds its
          // last ngrx/store import alongside the list config migration.
          void this.router.navigate(["kubernetes", connectedEndpoints[0].guid]);
        }
        return connectedEndpoints.length;
      }),
      filter((connectedEndpointsCount) => connectedEndpointsCount > 1),
      take(1),
    );
  }

  ngOnInit(): void {
    // Touch the lazily-built signal config so the view pipeline wires
    // up before the template binds. Without this, the @if-gated
    // <app-signal-list> doesn't construct the config until the
    // connected endpoint count resolves, deferring the first render.
    void this.endpointsSignalConfig.config;
  }

  ngOnDestroy(): void {
    // Drop the cached config so a future re-mount rebuilds (and the
    // service — which is `providedIn: 'root'` — doesn't keep a stale
    // view pipeline alive across navigations).
    this.endpointsSignalConfig.destroy();
  }
}
