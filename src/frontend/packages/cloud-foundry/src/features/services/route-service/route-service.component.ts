import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Signal, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import {
  IHeaderBreadcrumb,
  PageHeaderComponent,
  SignalStepHandle,
  StepComponent,
  SteppersComponent,
} from '@stratosui/core';
import { writeWithJob } from '../../../services/async-jobs/write-with-job';
import { StratosJobError } from '../../../services/async-jobs/async-job.types';
import {
  RouteServiceBindingView,
  ServiceCatalogDataService,
  SignalSource,
} from '../../../services/endpoint-data/service-catalog-data.service';
import { StServiceInstance } from '../../../services/endpoint-data/stratos-types';

// RouteServiceComponent — per-route "route service" management, reached via the
// /services/route-service/:endpointId/:routeGuid route (Route Service row action
// on the cf-routes lists). A route binds to 0-or-1 service instance (a route
// service). When unbound (or rebinding) it shows a one-step stepper to pick a
// managed service instance in the route's space and bind it; when bound it shows
// the binding with Unbind / Rebind. Bind/unbind ride the writeWithJob contract.
@Component({
  selector: 'app-route-service',
  templateUrl: './route-service.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent, SteppersComponent, StepComponent],
})
export class RouteServiceComponent {
  private http = inject(HttpClient);
  private catalog = inject(ServiceCatalogDataService);
  private router = inject(Router);

  readonly cfGuid: string;
  readonly routeGuid: string;
  readonly spaceGuid: string;
  readonly routeUrl: string;

  readonly title: Signal<string> = computed(() =>
    this.routeUrl ? `Route service for '${this.routeUrl}'` : 'Route service');
  readonly breadcrumbs: IHeaderBreadcrumb[];

  // Current binding (0-or-1), reloadable by swapping the source signal.
  private bindingSource = signal<SignalSource<RouteServiceBindingView | null>>(
    { value: signal<RouteServiceBindingView | null>(null).asReadonly(), isLoading: signal(false).asReadonly(), error: signal(null).asReadonly() },
  );
  readonly binding: Signal<RouteServiceBindingView | null> = computed(() => this.bindingSource().value());
  readonly loading: Signal<boolean> = computed(() => this.bindingSource().isLoading());

  // Managed service instances in the route's space — the bind picker, and the
  // source for resolving the bound instance's display name.
  private siSource: SignalSource<StServiceInstance[]>;
  readonly serviceInstances: Signal<StServiceInstance[]> = computed(() =>
    this.siSource.value().filter(si => si.type !== 'user-provided'));
  boundInstanceName = computed(() => {
    const guid = this.binding()?.serviceInstanceGuid;
    if (!guid) return '';
    return this.siSource.value().find(si => si.guid === guid)?.name ?? guid;
  });

  readonly selectedSiGuid = signal<string | null>(null);
  readonly rebinding = signal(false);
  readonly busy = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Show the bind stepper when there is no binding, or the user chose Rebind.
  readonly showStepper = computed(() => !this.loading() && (!this.binding() || this.rebinding()));

  readonly bindStepHandle: SignalStepHandle = {
    valid: computed(() => !!this.selectedSiGuid() && !this.busy()),
    submit: () => this.bind(),
  };

  constructor() {
    const route = inject(ActivatedRoute);
    this.cfGuid = route.snapshot.params.endpointId;
    this.routeGuid = route.snapshot.params.routeGuid;
    this.spaceGuid = route.snapshot.queryParamMap.get('space') ?? '';
    this.routeUrl = route.snapshot.queryParamMap.get('url') ?? '';
    this.breadcrumbs = [{ breadcrumbs: [{ value: 'Routes', routerLink: `/cloud-foundry/${this.cfGuid}/routes` }] }];
    this.siSource = this.catalog.serviceInstancesInSpace(this.cfGuid, this.spaceGuid);
    this.reload();
  }

  reload(): void {
    this.bindingSource.set(this.catalog.routeServiceBinding(this.cfGuid, this.routeGuid));
  }

  startRebind(): void {
    this.selectedSiGuid.set(null);
    this.errorMessage.set(null);
    this.rebinding.set(true);
  }

  private async bind(): Promise<void> {
    const siGuid = this.selectedSiGuid();
    if (!siGuid || this.busy()) return;
    this.busy.set(true);
    this.errorMessage.set(null);
    // Rebind: drop the existing binding first (route-service bindings are
    // immutable except metadata, so "edit" = unbind + rebind).
    const existing = this.binding();
    try {
      if (existing) {
        await writeWithJob(
          this.http,
          this.http.delete(`/pp/v1/cf/service_route_bindings/${this.cfGuid}/${existing.guid}`, { observe: 'response' as const }),
        );
      }
      const body = {
        relationships: {
          route: { data: { guid: this.routeGuid } },
          service_instance: { data: { guid: siGuid } },
        },
      };
      await writeWithJob(
        this.http,
        this.http.post(`/pp/v1/cf/service_route_bindings/${this.cfGuid}`, body, { observe: 'response' as const }),
      );
      this.rebinding.set(false);
      this.selectedSiGuid.set(null);
      this.reload();
    } catch (err: unknown) {
      this.errorMessage.set(`Failed to bind service: ${this.messageOf(err)}`);
      throw err instanceof Error ? err : new Error(this.messageOf(err));
    } finally {
      this.busy.set(false);
    }
  }

  async unbind(): Promise<void> {
    const existing = this.binding();
    if (!existing || this.busy()) return;
    this.busy.set(true);
    this.errorMessage.set(null);
    try {
      await writeWithJob(
        this.http,
        this.http.delete(`/pp/v1/cf/service_route_bindings/${this.cfGuid}/${existing.guid}`, { observe: 'response' as const }),
      );
      this.reload();
    } catch (err: unknown) {
      this.errorMessage.set(`Failed to unbind service: ${this.messageOf(err)}`);
    } finally {
      this.busy.set(false);
    }
  }

  private messageOf(err: unknown): string {
    if (err instanceof StratosJobError) return err.message;
    if (err instanceof Error) return err.message;
    return 'unknown error';
  }
}
