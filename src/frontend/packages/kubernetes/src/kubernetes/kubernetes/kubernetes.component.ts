import { CommonModule } from "@angular/common";
import {
  Component,
  OnDestroy,
  OnInit,
  inject,
  ChangeDetectionStrategy,
} from "@angular/core";
import { Router } from "@angular/router";
import { Observable } from "rxjs";
import { take, filter, map } from "rxjs/operators";

import { SignalListComponent } from "@stratosui/core";

import { EndpointCardComponent } from "../../../../core/src/shared/components/endpoint-list/endpoint-card/endpoint-card.component";
import { EndpointListHelper } from "../../../../core/src/shared/components/endpoint-list/endpoint-list.helpers";
import { PageHeaderComponent } from "../../../../core/src/shared/components/page-header/page-header.component";
import { KubernetesEndpointsSignalConfigService } from "../list-types/kubernetes-endpoints/kubernetes-endpoints-signal-config.service";
import { KubernetesService } from "../services/kubernetes.service";

@Component({
  selector: "app-kubernetes",
  templateUrl: "./kubernetes.component.html",

  providers: [EndpointListHelper, KubernetesService],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    PageHeaderComponent,
    SignalListComponent,
    EndpointCardComponent,
  ],
})
export class KubernetesComponent implements OnInit, OnDestroy {
  connectedEndpoints$: Observable<number>;
  private kubeService = inject(KubernetesService);
  private router = inject(Router);
  // Wave-3: signal-native list config. The service is now a true
  // SignalListConfig orchestrator — no `Store` import, no
  // BaseEndpointsDataSource. The card template below renders rows via
  // the standard EndpointCardComponent without binding `dataSource`,
  // which keeps the kebab menu suppressed (matching the legacy
  // `dsEndpointType: 'k8s'` flag) and leaves cardStatus$ unset
  // (matching the legacy "no per-row error indicator" behaviour).
  readonly endpointsSignalConfig = inject(
    KubernetesEndpointsSignalConfigService,
  );

  constructor() {
    this.connectedEndpoints$ = this.kubeService.kubeEndpoints$.pipe(
      map((kubeEndpoints) => {
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
