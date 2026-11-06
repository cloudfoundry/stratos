import { DatePipe, NgClass } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, Signal, signal, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import {
  IHeaderBreadcrumb,
  PageHeaderComponent,
  SignalStepHandle,
  StepComponent,
  SteppersComponent,
} from '@stratosui/core';
import { StratosJobError } from '../../../services/async-jobs/async-job.types';
import { EntityDeleteController } from '../../../services/deletes/entity-delete.controller';
import { runCfDelete } from '../../../services/deletes/run-cf-delete';
import { serviceCredentialBindingEntityType } from '../../../entity-relations/signal/cf-relation-registrations';
import { EndpointDataRegistry } from '../../../services/endpoint-data/endpoint-data.registry';
import { ServiceCatalogDataService, SignalSource } from '../../../services/endpoint-data/service-catalog-data.service';
import { StServiceCredentialBinding, StServiceInstance } from '../../../services/endpoint-data/stratos-types';
import { DetachAppsComponent } from './detach-apps/detach-apps.component';

type BindingStatus = 'pending' | 'busy' | 'success' | 'error';

interface BindingRow {
  guid: string;
  appName: string;
  appGuid: string;
  bindingDate: string;
  status: BindingStatus;
  errorMessage?: string;
}

@Component({
  selector: 'app-detach-service-instance',
  templateUrl: './detach-service-instance.component.html',
  styleUrls: ['./detach-service-instance.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgClass,
    PageHeaderComponent,
    SteppersComponent,
    StepComponent,
    DetachAppsComponent,
  ],
  providers: [DatePipe]
})
export class DetachServiceInstanceComponent implements OnDestroy {
  private datePipe = inject(DatePipe);
  private router = inject(Router);
  private http = inject(HttpClient);
  private serviceCatalog = inject(ServiceCatalogDataService);
  private endpointDataRegistry = inject(EndpointDataRegistry);
  private deleteController = inject(EntityDeleteController);


  private _instanceSource!: SignalSource<StServiceInstance | null>;
  readonly title: Signal<string> = computed(() => {
    const name = this._instanceSource?.value()?.name;
    return name ? `Unbind apps from '${name}'` : '';
  });
  readonly breadcrumbs: IHeaderBreadcrumb[] = [
    { breadcrumbs: [{ value: 'Services', routerLink: '/services' }] },
  ];
  cfGuid!: string;
  deleteStarted = signal(false);

  // Per-binding write status, keyed by binding guid. Replaces the
  // ngrx-coupled <app-action-monitor> wiring: writeWithJob promises
  // resolve into this map and the template re-renders from it.
  private statusByGuid = signal<Record<string, BindingStatus>>({});
  private errorByGuid = signal<Record<string, string>>({});
  // Selected bindings, set by the upstream <app-detach-apps> step.
  private _selectedBindings = signal<StServiceCredentialBinding[]>([]);

  rows = computed<BindingRow[]>(() => {
    const bindings = this._selectedBindings();
    const statuses = this.statusByGuid();
    const errors = this.errorByGuid();
    return bindings.map(b => ({
      guid: b.guid,
      appName: b.app?.name ?? '',
      appGuid: b.app?.guid ?? '',
      bindingDate: this.datePipe.transform(b.createdAt, 'medium') ?? '',
      status: statuses[b.guid] ?? 'pending',
      errorMessage: errors[b.guid],
    }));
  });

  // Always valid: the user already picked ≥1 binding in the prior step.
  // Submit dispatches one v3 DELETE per binding via writeWithJob, tracking
  // each row's outcome in `statusByGuid`. Re-click after deleteStarted
  // navigates to /services.
  confirmStepHandle: SignalStepHandle = {
    valid: signal(true).asReadonly(),
    submit: async () => {
      if (this.deleteStarted()) {
        await this.router.navigate(['/services']);
        return;
      }
      this.deleteStarted.set(true);
      const bindings = this._selectedBindings();
      if (bindings.length === 0) return;

      // Mark every row busy up-front so the user sees progress immediately
      // even if the network is slow.
      this.statusByGuid.update(prev => {
        const next = { ...prev };
        for (const b of bindings) next[b.guid] = 'busy';
        return next;
      });

      // Fire all deletes in parallel; settle whichever way each lands.
      await Promise.all(bindings.map(b => this.detachOne(b.guid)));
    },
  };

  constructor() {
    const activatedRoute = inject(ActivatedRoute);

    this.cfGuid = activatedRoute.snapshot.params.endpointId;
    const serviceInstanceId = activatedRoute.snapshot.params.serviceInstanceId;
    this._instanceSource = this.serviceCatalog.serviceInstance(this.cfGuid, serviceInstanceId);
    // Hold a refcount on the endpoint's data service so the delete chokepoint
    // can find (peek) it to invalidate the binding rollups after each detach.
    this.endpointDataRegistry.acquire(this.cfGuid);
  }

  ngOnDestroy() {
    this.endpointDataRegistry.release(this.cfGuid);
  }

  setSelectedBindings = (selectedBindings: StServiceCredentialBinding[]) => {
    this._selectedBindings.set(selectedBindings);
  }

  private async detachOne(bindingGuid: string): Promise<void> {
    try {
      // Route through the EntityDeleteController chokepoint so the canonical
      // EDS._serviceCredentialBindings list updates and the graph-derived
      // invalidation fires (bound apps/SI re-fetch their binding rollups).
      await runCfDelete(this.deleteController, this.http, {
        cnsiGuid: this.cfGuid,
        entityKind: serviceCredentialBindingEntityType,
        deleteGuid: bindingGuid,
        path: `/pp/v1/cf/service_bindings/${this.cfGuid}/${bindingGuid}`,
      });
      this.statusByGuid.update(prev => ({ ...prev, [bindingGuid]: 'success' }));
    } catch (err: unknown) {
      const message = err instanceof StratosJobError
        ? err.message
        : err instanceof Error
          ? err.message
          : 'unknown error';
      this.statusByGuid.update(prev => ({ ...prev, [bindingGuid]: 'error' }));
      this.errorByGuid.update(prev => ({ ...prev, [bindingGuid]: message }));
    }
  }

}
