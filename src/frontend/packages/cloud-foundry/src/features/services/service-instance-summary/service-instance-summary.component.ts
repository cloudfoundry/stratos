import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  Signal,
  WritableSignal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import {
  AppChip,
  ConfirmationDialogConfig,
  ConfirmationDialogService,
  IHeaderBreadcrumb,
  MetaCardComponent,
  MetaCardItemComponent,
  MetaCardKeyComponent,
  MetaCardTitleComponent,
  MetaCardValueComponent,
  AppChipsComponent,
  PageHeaderComponent,
  SignalListRowAction,
  TailwindSnackBarService,
} from '@stratosui/core';
import { of } from 'rxjs';

import { serviceCredentialBindingEntityType } from '../../../entity-relations/signal/cf-relation-registrations';
import { EndpointDataRegistry } from '../../../services/endpoint-data/endpoint-data.registry';
import { EntityDeleteController } from '../../../services/deletes/entity-delete.controller';
import { runCfDelete } from '../../../services/deletes/run-cf-delete';
import { ServiceCatalogDataService, SignalSource } from '../../../services/endpoint-data/service-catalog-data.service';
import {
  CfServiceInstancesSignalConfigService,
} from '../../../shared/signal-list-configs/service-instance/cf-service-instances-signal-config.service';
import {
  buildServiceInstanceRowActions,
} from '../../../shared/signal-list-configs/service-instance/service-instance-row-actions';
import { StServiceCredentialBinding, StServiceInstance } from '../../../services/endpoint-data/stratos-types';

interface BindingRow {
  guid: string;
  appName: string;
}

interface InstanceView {
  name: string;
  isManaged: boolean;
  typeLabel: string;
  status: string;
  statusDetail: string;
  plan: string;
  offering: string;
  broker: string;
  dashboardUrl: string;
  routeServiceUrl: string;
  syslogDrainUrl: string;
  space: string;
  org: string;
  tags: AppChip<string>[];
  createdAt: string;
  updatedAt: string;
}

/**
 * ServiceInstanceSummaryComponent — per-instance read view (#5370).
 *
 * The single read surface for one service instance, managed or
 * user-provided, at `/services/:type/:cnsi/:siGuid` (the parent of the
 * existing `.../edit` write stepper). Branches its metadata on instance
 * type: managed shows plan/offering/broker/dashboard, UPS shows the route-
 * service and syslog-drain URLs.
 *
 * Phase 1+2 (this commit): route shell + metadata card. Still to come:
 * bindings list + unbind (Phase 3), action bar (Phase 4), uniform card
 * linking (Phase 5), read-only parameters (Phase 6, needs a backend fetch).
 * UPS credentials metadata is an open question and is deliberately omitted
 * for now.
 */
@Component({
  selector: 'app-service-instance-summary',
  templateUrl: './service-instance-summary.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    PageHeaderComponent,
    MetaCardComponent,
    MetaCardTitleComponent,
    MetaCardItemComponent,
    MetaCardKeyComponent,
    MetaCardValueComponent,
    AppChipsComponent,
  ],
})
export class ServiceInstanceSummaryComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly serviceCatalog = inject(ServiceCatalogDataService);
  private readonly http = inject(HttpClient);
  private readonly deleteController = inject(EntityDeleteController);
  private readonly registry = inject(EndpointDataRegistry);
  private readonly confirmDialog = inject(ConfirmationDialogService);
  private readonly snackBar = inject(TailwindSnackBarService);
  private readonly router = inject(Router);
  private readonly instancesConfig = inject(CfServiceInstancesSignalConfigService);

  private readonly cfGuid: string;
  private readonly siGuid: string;
  private readonly source: SignalSource<StServiceInstance | null>;

  // One-shot bindings fetch; re-issued after an unbind so the list refreshes
  // (the thin data service doesn't auto-update like the EDS rollups).
  private readonly bindingsSource: WritableSignal<SignalSource<StServiceCredentialBinding[]>>;

  readonly breadcrumbs: IHeaderBreadcrumb[] = [
    { breadcrumbs: [{ value: 'Services', routerLink: '/services' }] },
  ];

  readonly loading: Signal<boolean>;
  readonly error: Signal<boolean>;
  readonly view: Signal<InstanceView | null>;
  readonly title: Signal<string>;
  readonly bindingsLoading: Signal<boolean>;
  readonly bindings: Signal<BindingRow[]>;
  readonly actions: Signal<SignalListRowAction<StServiceInstance>[]>;

  constructor() {
    this.cfGuid = this.route.snapshot.params.endpointId;
    this.siGuid = this.route.snapshot.params.serviceInstanceId;
    this.source = this.serviceCatalog.serviceInstance(this.cfGuid, this.siGuid);
    this.bindingsSource = signal(this.serviceCatalog.serviceBindingsForInstance(this.cfGuid, this.siGuid));

    // Hold a refcount on the endpoint's data service so the delete chokepoint
    // can peek it to invalidate binding rollups (the wall's "Attached Apps",
    // app pages) after an unbind.
    this.registry.acquire(this.cfGuid);

    this.loading = this.source.isLoading;
    this.error = computed(() => this.source.error() != null);
    this.view = computed(() => {
      const si = this.source.value();
      return si ? this.toView(si) : null;
    });
    this.title = computed(() => this.view()?.name ?? '');

    this.bindingsLoading = computed(() => this.bindingsSource().isLoading());
    this.bindings = computed(() =>
      (this.bindingsSource().value() ?? [])
        .filter(b => b.type === 'app')
        .map(b => ({ guid: b.guid, appName: b.app?.name ?? b.app?.guid ?? '' })),
    );

    // Header action bar. Reuse the shared builder (Edit / Service Keys /
    // Delete) so the route conventions and keys gating match the lists.
    // Detach is dropped — the inline per-app Unbind above covers it. Delete
    // here also navigates back to the wall, since the page's instance is gone.
    this.actions = computed(() => {
      const si = this.source.value();
      if (!si) { return []; }
      return buildServiceInstanceRowActions(si, {
        router: this.router,
        confirmDialog: this.confirmDialog,
        snackBar: this.snackBar,
        deleteServiceInstance: async (cnsiGuid, guid) => {
          await this.instancesConfig.deleteServiceInstance(cnsiGuid, guid, si.name);
          void this.router.navigate(['/services']);
        },
        // Offering-bindability cache isn't warmed on this page; fail open so
        // Service Keys shows for managed instances (the builder's convention).
        isOfferingBindable: () => undefined,
      }).filter(a => a.label !== 'Detach');
    });
  }

  ngOnDestroy(): void {
    this.registry.release(this.cfGuid);
  }

  /** Invoke a header action (the builder's invokes close over the instance). */
  runAction(action: SignalListRowAction<StServiceInstance>): void {
    const si = this.source.value();
    if (si) { void action.invoke(si); }
  }

  /** Unbind one app from this instance (confirm → v3 DELETE → re-fetch list). */
  unbind(row: BindingRow): void {
    const confirm = new ConfirmationDialogConfig(
      'Unbind Application',
      `Unbind "${row.appName}" from this service instance?`,
      'Unbind',
      true,
    );
    this.confirmDialog.open(confirm, async () => {
      try {
        await runCfDelete(this.deleteController, this.http, {
          cnsiGuid: this.cfGuid,
          entityKind: serviceCredentialBindingEntityType,
          deleteGuid: row.guid,
          path: `/pp/v1/cf/service_bindings/${this.cfGuid}/${row.guid}`,
        });
        // Re-issue the one-shot fetch so the unbound app drops out.
        this.bindingsSource.set(this.serviceCatalog.serviceBindingsForInstance(this.cfGuid, this.siGuid));
      } catch (err: unknown) {
        this.snackBar.error(`Unbind failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    });
  }

  private toView(si: StServiceInstance): InstanceView {
    const isManaged = si.type !== 'user-provided';
    return {
      name: si.name,
      isManaged,
      typeLabel: isManaged ? 'Managed' : 'User-provided',
      status: si.lastOperation?.state ?? '',
      statusDetail: si.lastOperation?.description ?? '',
      plan: si.servicePlan?.name ?? '',
      offering: si.servicePlan?.serviceOffering?.name ?? '',
      broker: si.servicePlan?.serviceOffering?.broker?.name ?? '',
      dashboardUrl: si.dashboardUrl ?? '',
      routeServiceUrl: si.routeServiceUrl ?? '',
      syslogDrainUrl: si.syslogDrainUrl ?? '',
      space: si.space?.name ?? '',
      org: si.space?.organization?.name ?? '',
      tags: (si.tags ?? []).map(t => ({ value: t, hideClearButton$: of(true) })),
      createdAt: si.createdAt ?? '',
      updatedAt: si.updatedAt ?? '',
    };
  }
}
