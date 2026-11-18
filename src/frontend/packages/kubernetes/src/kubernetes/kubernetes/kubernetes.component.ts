import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  linkedSignal,
  untracked,
  ChangeDetectionStrategy,
} from "@angular/core";
import { Router } from "@angular/router";

import { SignalListComponent } from "@stratosui/core";

import { EndpointsSignalService } from "../../../../core/src/core/signals/endpoints-signal.service";
import { DuplicateUrlBannerComponent } from "../../../../core/src/shared/components/duplicate-url-banner/duplicate-url-banner.component";
import { PageHeaderComponent } from "../../../../core/src/shared/components/page-header/page-header.component";
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
    PageHeaderComponent,
    SignalListComponent,
    DuplicateUrlBannerComponent,
  ],
})
export class KubernetesComponent implements OnInit, OnDestroy {
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
  protected readonly connectedKubeEndpoints = computed(() =>
    this.endpointsSignals.connectedEndpoints().filter(ep => ep?.cnsi_type === KUBERNETES_ENDPOINT_TYPE),
  );

  // 'expired' deliberately excluded: a dead-token endpoint must not count
  // as the "one connected endpoint" that triggers the auto-navigate below —
  // entering it would just land on a broken view.
  private readonly connectedKube = computed(() =>
    this.kubeService.kubeEndpoints().filter(c => c.connectionStatus === "connected"),
  );

  // The list shows once more than one endpoint is connected and stays shown.
  readonly showList = linkedSignal<boolean, boolean>({
    source: () => this.connectedKube().length > 1,
    computation: (many, previous) => many || (previous?.value ?? false),
  });

  constructor() {
    // Single connected endpoint → go straight to its page, unless the list
    // has already been shown.
    effect(() => {
      const connected = this.connectedKube();
      if (connected.length === 1 && !untracked(this.showList)) {
        untracked(() => void this.router.navigate(["kubernetes", connected[0].guid]));
      }
    });
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
