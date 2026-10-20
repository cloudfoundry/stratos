import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  Signal,
  WritableSignal,
  computed,
  effect,
  inject,
  linkedSignal,
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
  TailwindDialogService,
  TailwindSnackBarService,
} from '@stratosui/core';
import { of } from 'rxjs';

import { JsonViewerComponent } from '../../../../../core/src/shared/components/json-viewer/json-viewer.component';
import { serviceCredentialBindingEntityType } from '../../../entity-relations/signal/cf-relation-registrations';
import { EndpointDataRegistry } from '../../../services/endpoint-data/endpoint-data.registry';
import { unknownHowOf, unknownOutcomeMessage } from '../../../services/async-jobs/unknown-outcome-message';
import { EntityDeleteController } from '../../../services/deletes/entity-delete.controller';
import { runCfDelete } from '../../../services/deletes/run-cf-delete';
import { ServiceCatalogDataService, SignalSource } from '../../../services/endpoint-data/service-catalog-data.service';
import {
  CredentialField,
  MaskedCredentialsComponent,
  toCredentialFields,
} from '../../../shared/components/masked-credentials/masked-credentials.component';
import { CfServiceInstancesSignalConfigService, operationRunning } from '../../../shared/signal-list-configs/service-instance/cf-service-instances-signal-config.service';
import {
  buildServiceInstanceRowActions,
} from '../../../shared/signal-list-configs/service-instance/service-instance-row-actions';
import {
  lastOperationLabel,
  lastOperationReason,
} from '../../../shared/signal-list-configs/service-instance/service-instance-columns';
import { StServiceCredentialBinding, StServiceInstance } from '../../../services/endpoint-data/stratos-types';
import {
  ShareServiceInstanceDialogComponent,
  ShareServiceInstanceDialogData,
} from './share-service-instance-dialog.component';
import { AppBusyComponent } from '@stratosui/core';
import { extractHttpErrorMessage } from '@stratosui/store';

interface BindingRow {
  guid: string;
  appName: string;
}

interface InstanceView {
  name: string;
  isManaged: boolean;
  typeLabel: string;
  // "Update failed"; empty when CF records no operation.
  lastOperation: string;
  // The broker's reason, on a failure only.
  lastOperationReason: string;
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
 * Sections: metadata card, bound-applications list with unbind, a header
 * action bar, and two lazily-fetched expandable sections — Parameters
 * (managed + UPS, read-only json-viewer) and Credentials (UPS only, masked
 * with per-field reveal). Both expandable sections fetch only on expand: a
 * deliberate choice so credentials never hit CF until the user explicitly
 * asks, and so a broker that doesn't support parameter retrieval errors only
 * the section, not the page.
 */
const PROGRESS_POLL_MS = 10000;

@Component({
  selector: 'app-service-instance-summary',
  templateUrl: './service-instance-summary.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppBusyComponent,
    CommonModule,
    PageHeaderComponent,
    MetaCardComponent,
    MetaCardTitleComponent,
    MetaCardItemComponent,
    MetaCardKeyComponent,
    MetaCardValueComponent,
    AppChipsComponent,
    JsonViewerComponent,
    MaskedCredentialsComponent,
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
  private readonly dialog = inject(TailwindDialogService);

  private readonly cfGuid: string;
  private readonly siGuid: string;
  // One-shot instance fetch; re-issued when a delete ends with an unknown
  // result so the page shows whether the instance is still there.
  private readonly sourceRef: WritableSignal<SignalSource<StServiceInstance | null>>;
  private get source(): SignalSource<StServiceInstance | null> {
    return this.sourceRef();
  }

  // One-shot bindings fetch; re-issued after an unbind so the list refreshes
  // (the thin data service doesn't auto-update like the EDS rollups).
  private readonly bindingsSource: WritableSignal<SignalSource<StServiceCredentialBinding[]>>;

  readonly breadcrumbs: IHeaderBreadcrumb[] = [
    { breadcrumbs: [{ value: 'Services', routerLink: '/services' }] },
  ];

  // The last instance read. A re-read keeps it on screen until the new
  // answer lands (or fails), so polling never flashes the page empty.
  private readonly instance: Signal<StServiceInstance | null>;

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
    this.sourceRef = signal(this.serviceCatalog.serviceInstance(this.cfGuid, this.siGuid));
    this.bindingsSource = signal(this.serviceCatalog.serviceBindingsForInstance(this.cfGuid, this.siGuid));

    // Hold a refcount on the endpoint's data service so the delete chokepoint
    // can peek it to invalidate binding rollups (the wall's "Attached Apps",
    // app pages) after an unbind.
    this.registry.acquire(this.cfGuid);

    this.instance = linkedSignal<{ si: StServiceInstance | null; settled: boolean }, StServiceInstance | null>({
      source: () => ({ si: this.source.value(), settled: !this.source.isLoading() && this.source.error() == null }),
      computation: (read, previous) => read.settled || !previous?.value ? read.si : previous.value,
    });
    this.loading = computed(() => this.source.isLoading() && !this.instance());
    this.error = computed(() => this.source.error() != null && !this.instance());
    this.view = computed(() => {
      const si = this.instance();
      return si ? this.toView(si) : null;
    });
    this.title = computed(() => this.view()?.name ?? '');

    // While an operation is in progress, re-read the instance so its status
    // follows the broker (#6002). Ends with the operation or the page.
    effect((onCleanup) => {
      const si = this.instance();
      if (!si || !operationRunning(si)) return;
      const timer = setInterval(() => {
        if (!this.source.isLoading()) this.reread();
      }, PROGRESS_POLL_MS);
      onCleanup(() => clearInterval(timer));
    });

    this.bindingsLoading = computed(() => this.bindingsSource().isLoading());
    this.bindings = computed(() =>
      (this.bindingsSource().value() ?? [])
        .filter(b => b.type === 'app')
        .map(b => ({ guid: b.guid, appName: b.app?.name ?? b.app?.guid ?? '' })),
    );

    // Header action bar. Reuse the shared builder (Edit / Service Keys /
    // Delete) so the route conventions and keys gating match the lists.
    // Detach is dropped — the inline per-app Unbind above covers it. Delete
    // here also navigates back to the wall, since the page's instance is gone;
    // after an unknown result the page stays and re-reads the instance.
    this.actions = computed(() => {
      const si = this.instance();
      if (!si) { return []; }
      return buildServiceInstanceRowActions(si, {
        router: this.router,
        confirmDialog: this.confirmDialog,
        snackBar: this.snackBar,
        deleteServiceInstance: async (cnsiGuid, guid) => {
          const outcome = await this.instancesConfig.deleteServiceInstance(cnsiGuid, guid, si.name);
          if (outcome === 'deleted') {
            void this.router.navigate(['/services']);
          } else {
            this.reread();
          }
          return outcome;
        },
        unknownOutcomeWhere: 'This page',
        // Offering-bindability cache isn't warmed on this page; fail open so
        // Service Keys shows for managed instances (the builder's convention).
        isOfferingBindable: () => undefined,
      }).filter(a => a.label !== 'Detach');
    });
  }

  // Parameters section — lazy, click-to-expand. Managed and UPS both expose
  // CF's GET .../parameters; the source is created on first expand so the page
  // load stays light and a broker that errors only fails this section.
  private readonly paramsOpen = signal(false);
  private readonly paramsSource = signal<SignalSource<Record<string, unknown> | null> | null>(null);
  readonly isParamsOpen = computed(() => this.paramsOpen());
  readonly paramsLoading = computed(() => this.paramsSource()?.isLoading() ?? false);
  // An error here means the broker doesn't support parameter retrieval — a
  // normal condition for many services, shown as "not available" rather than
  // an error, and kept distinct from an empty object ("no parameters").
  readonly paramsUnavailable = computed(() => this.paramsSource()?.error() != null);
  readonly params = computed(() => this.paramsSource()?.value() ?? null);
  readonly paramsEmpty = computed(() => {
    const p = this.params();
    return p != null && Object.keys(p).length === 0;
  });

  // Credentials section — UPS only, lazy, click-to-expand. Sensitive, so the
  // fetch is deferred until the user opens the section; values are masked by
  // default in the rendered MaskedCredentialsComponent.
  private readonly credsOpen = signal(false);
  private readonly credsSource = signal<SignalSource<Record<string, unknown> | null> | null>(null);
  readonly isCredsOpen = computed(() => this.credsOpen());
  readonly credsLoading = computed(() => this.credsSource()?.isLoading() ?? false);
  readonly credsError = computed(() => this.credsSource()?.error() != null);
  readonly credentialFields = computed<CredentialField[]>(() => {
    const c = this.credsSource()?.value();
    return c ? toCredentialFields(c) : [];
  });

  /** Expand/collapse the Parameters section; fetch lazily on first expand. */
  toggleParams(): void {
    const opening = !this.paramsOpen();
    this.paramsOpen.set(opening);
    if (opening && this.paramsSource() == null) {
      this.paramsSource.set(this.serviceCatalog.serviceInstanceParameters(this.cfGuid, this.siGuid));
    }
  }

  /** Expand/collapse the Credentials section; fetch lazily on first expand. */
  toggleCreds(): void {
    const opening = !this.credsOpen();
    this.credsOpen.set(opening);
    if (opening && this.credsSource() == null) {
      this.credsSource.set(this.serviceCatalog.userProvidedCredentials(this.cfGuid, this.siGuid));
    }
  }

  ngOnDestroy(): void {
    this.registry.release(this.cfGuid);
  }

  private reread(): void {
    this.sourceRef.set(this.serviceCatalog.serviceInstance(this.cfGuid, this.siGuid));
  }

  // Share is a managed-instance-only affordance — CF rejects sharing a
  // user-provided instance. Gated in the template so the button only shows
  // for managed instances that have loaded.
  readonly canShare = computed(() => this.instance()?.type != null
    && this.instance()?.type !== 'user-provided');

  /** Invoke a header action (the builder's invokes close over the instance). */
  runAction(action: SignalListRowAction<StServiceInstance>): void {
    const si = this.instance();
    if (si) { void action.invoke(si); }
  }

  // Open the multi-select "Share to spaces" dialog. Bulk-shares this managed
  // instance with the chosen spaces in one call (POST .../relationships/
  // shared_spaces, body { guids }). The instance's own space is passed so the
  // picker can exclude it. Managed-only — see canShare.
  openShareToSpaces(): void {
    const si = this.instance();
    if (!si) { return; }
    this.dialog.open<ShareServiceInstanceDialogComponent, ShareServiceInstanceDialogData, boolean>(
      ShareServiceInstanceDialogComponent,
      {
        ariaLabelledBy: 'share-service-instance-dialog-title',
        data: {
          cfGuid: this.cfGuid,
          siGuid: this.siGuid,
          siName: si.name,
          ownerSpaceGuid: si.space?.guid,
        },
        width: '520px',
      },
    );
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
        const outcome = await runCfDelete(this.deleteController, this.http, {
          cnsiGuid: this.cfGuid,
          entityKind: serviceCredentialBindingEntityType,
          deleteGuid: row.guid,
          path: `/pp/v1/cf/service_bindings/${this.cfGuid}/${row.guid}`,
        });
        // Re-issue the one-shot fetch so the unbound app drops out, or so
        // the list shows whether it did after an unknown result.
        this.bindingsSource.set(this.serviceCatalog.serviceBindingsForInstance(this.cfGuid, this.siGuid));
        const how = unknownHowOf(outcome);
        if (how) {
          this.snackBar.error(unknownOutcomeMessage(`Unbind "${row.appName}"`, 'This page', how));
        }
      } catch (err: unknown) {
        this.snackBar.error(`Unbind failed: ${extractHttpErrorMessage(err)}`);
      }
    });
  }

  private toView(si: StServiceInstance): InstanceView {
    const isManaged = si.type !== 'user-provided';
    return {
      name: si.name,
      isManaged,
      typeLabel: isManaged ? 'Managed' : 'User-provided',
      lastOperation: lastOperationLabel(si),
      lastOperationReason: lastOperationReason(si),
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
