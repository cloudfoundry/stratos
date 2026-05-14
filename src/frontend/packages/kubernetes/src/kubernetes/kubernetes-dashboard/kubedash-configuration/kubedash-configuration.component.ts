import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BooleanIndicatorComponent, MetadataItemComponent, CardProgressOverlayComponent } from '@stratosui/core';

import { ConfirmationDialogConfig } from '../../../../../core/src/shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../../core/src/shared/components/confirmation-dialog.service';
import { IHeaderBreadcrumb } from '../../../../../core/src/shared/components/page-header/page-header.types';
import { PageHeaderModule } from '../../../../../core/src/shared/components/page-header/page-header.module';
import { ProductNameComponent } from '../../../../../core/src/shared/components/product-name.ccomponent';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';
import { KubernetesService } from '../../services/kubernetes.service';

// Local copy of the kubedash status shape — wave-3 deletes the legacy
// `store/kubernetes.effects.ts` location, so the consumer-side code holds
// its own type definition rather than importing from store/. Matches the
// jetstream `/pp/v1/kubedash/{guid}/status` payload.
export interface KubeDashboardServiceInfo {
  namespace: string;
  name: string;
  scheme: string;
}

export interface KubeDashboardStatus {
  guid?: string;
  kubeGuid?: string;
  installed: boolean;
  stratosInstalled?: boolean;
  running?: boolean;
  version?: string;
  service?: KubeDashboardServiceInfo;
  serviceAccount?: { metadata: { name: string; namespace: string } } | null;
}

type MessageUpdater = (msg: string) => void;

@Component({
  selector: 'app-kubedash-configuration',
  templateUrl: './kubedash-configuration.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BooleanIndicatorComponent,
    MetadataItemComponent,
    CardProgressOverlayComponent,
    PageHeaderModule,
    ProductNameComponent
  ],
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
  ]
})
export class KubedashConfigurationComponent implements OnDestroy {

  // Confirmation dialog
  deleteServiceAccountConfirmation = new ConfirmationDialogConfig(
    'Delete Service Account?',
    'Are you sure you want to delete the Service Account and Cluster Role Binding?',
    'Delete'
  );

  createServiceAccountConfirmation = new ConfirmationDialogConfig(
    'Create Service Account?',
    'Are you sure you want to create the Service Account and Cluster Role Binding?',
    'Create'
  );

  installDashboardConfirmation = new ConfirmationDialogConfig(
    'Install Kubernetes Dashboard?',
    'Are you sure you want to install the Kubernetes Dashboard into this cluster?',
    'Install'
  );

  deleteDashboardConfirmation = new ConfirmationDialogConfig(
    'Delete Kubernetes Dashboard?',
    'Are you sure you want to delete the Kubernetes Dashboard from this cluster?' +
    'This will delete the dashboard namespace and cluster service account and role binding',
    'Delete'
  );

  public breadcrumbs$: Observable<IHeaderBreadcrumb[]>;

  // Signal-native dashboard status — fetched directly from the kubedash
  // status endpoint, no ngrx dispatch. Wave-3 deletes the ngrx kubeEntityCatalog
  // dashboard slice; the consumer (this component) is the only reader, so it
  // owns its own cache.
  private readonly _dashboardStatus = signal<KubeDashboardStatus | null>(null);
  public readonly dashboardStatus = this._dashboardStatus.asReadonly();
  public readonly isAzure = computed(() => {
    const status = this._dashboardStatus();
    return !!status && !!status.version && status.version.indexOf('azure') !== -1;
  });
  public readonly isDashboardConfigured = computed(() => {
    const status = this._dashboardStatus();
    return !!status && !!status.installed && !!status.serviceAccount && !!status.service;
  });

  // Signals for busy state tracking
  public serviceAccountBusy = signal<boolean>(false);
  public serviceAccountMsg = '';

  public dashboardUIBusy = signal<boolean>(false);
  public dashboardUIMsg = '';

  // Are we busy with an operation - disable buttons if we are
  public isBusy = signal<boolean>(false);

  // Is the status loading — true on first load and during refresh().
  public isUpdatingStatus = signal<boolean>(true);

  public dashboardLink: string;
  public kubeEndpointService = inject(KubernetesEndpointService);
  private httpClient = inject(HttpClient);
  private confirmDialog = inject(ConfirmationDialogService);

  constructor() {
    this.dashboardLink = `/kubernetes/${this.kubeEndpointService.kubeGuid}/dashboard`;

    this.breadcrumbs$ = this.kubeEndpointService.endpoint$.pipe(
      map(endpoint => ([{
        breadcrumbs: [{ value: endpoint.entity.name, routerLink: `/kubernetes/${endpoint.entity.guid}` }]
      }]))
    );

    // Kick off initial status fetch.
    this.refreshStatus();
  }

  ngOnDestroy() {
    // No subscriptions to clean up — status is signal-backed.
  }

  // Fetch the kubedash status payload directly from jetstream. Replaces
  // the prior `kubeEntityCatalog.dashboard.api.get(...)` ngrx dispatch.
  private refreshStatus() {
    const guid = this.kubeEndpointService.kubeGuid;
    if (!guid) {
      return;
    }
    this.isUpdatingStatus.set(true);
    this.httpClient.get<KubeDashboardStatus>(`/pp/v1/kubedash/${guid}/status`).subscribe({
      next: (status) => {
        this._dashboardStatus.set(status ?? null);
        this.isUpdatingStatus.set(false);
      },
      error: () => {
        // Treat fetch failure as "no status yet" — surface via the
        // existing "Retrieving Dashboard configuration ..." spinner clearing
        // and falling through to install / configure UI when the user
        // re-triggers an action.
        this._dashboardStatus.set(null);
        this.isUpdatingStatus.set(false);
      }
    });
  }

  public createServiceAccount() {
    this.confirmDialog.open(this.createServiceAccountConfirmation, () => {
      this.doCreateServiceAccount();
    });
  }

  public doCreateServiceAccount() {
    this.makeRequest('post',
      'serviceAccount',
      'Creating Service Account ...',
      'Service Account created', 'An error occurred creating the Service Account',
      this.serviceAccountBusy,
      (msg) => this.serviceAccountMsg = msg
    );
  }

  public deleteServiceAccount() {
    this.confirmDialog.open(this.deleteServiceAccountConfirmation, () => {
      this.doDeleteServiceAccount();
    });
  }

  public doDeleteServiceAccount() {
    this.makeRequest('delete', 'serviceAccount',
      'Deleting Service Account ...',
      'Service Account deleted',
      'An error occurred deleting the Service Account', this.serviceAccountBusy,
      (msg => this.serviceAccountMsg = msg));
  }

  public installDashboard() {
    this.confirmDialog.open(this.installDashboardConfirmation, () => {
      this.doInstallDashboard();
    });
  }

  public doInstallDashboard() {
    this.makeRequest('post',
      'installation',
      'Installing Kubernetes Dashboard ...',
      'Kubernetes Dashboard installed', 'An error occurred installing the Kubernetes Dashboard',
      this.dashboardUIBusy,
      (msg) => this.dashboardUIMsg = msg
    );
  }

  public deleteDashboard() {
    this.confirmDialog.open(this.deleteDashboardConfirmation, () => {
      this.doDeleteDashboard();
    });
  }

  public doDeleteDashboard() {
    this.makeRequest('delete',
      'installation',
      'Deleting Kubernetes Dashboard ...',
      'Kubernetes Dashboard deleted', 'An error occurred deleting the Kubernetes Dashboard',
      this.dashboardUIBusy,
      (msg) => this.dashboardUIMsg = msg
    );
  }

  private makeRequest(
    method: string,
    op: string,
    busyMsg: string,
    okMsg: string,
    errorMsg: string,
    busy: ReturnType<typeof signal<boolean>>,
    msgUpdater: MessageUpdater) {
    const guid = this.kubeEndpointService.kubeGuid;
    const url = `/pp/v1/kubedash/${guid}/${op}`;
    let obs;
    msgUpdater(busyMsg);
    busy.set(true);
    this.isBusy.set(true);
    if (method === 'post') {
      obs = this.httpClient.post(url, {});
    } else if (method === 'delete') {
      obs = this.httpClient.delete(url, {});
    } else {
      console.error('Unsupported http method');
      return;
    }

    obs.subscribe(() => {
      console.log(okMsg); // Replace with proper notification system if needed
      msgUpdater(okMsg);
      busy.set(false);
      this.refresh();
    }, (e) => {
      let msg = errorMsg;
      if (e && e.error && e.error.error) {
        msg = e.error.error;
      }
      console.error(msg); // Replace with proper notification system if needed
      msgUpdater(msg);
      busy.set(false);
      this.refresh();
    });
  }

  private refresh() {
    this.isBusy.set(false);
    this.refreshStatus();
  }
}
