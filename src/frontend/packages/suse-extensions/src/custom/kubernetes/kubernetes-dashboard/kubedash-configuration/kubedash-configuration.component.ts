import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy } from '@angular/core';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';

import { ConfirmationDialogConfig } from '../../../../../../core/src/shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../../../core/src/shared/components/confirmation-dialog.service';
import { IHeaderBreadcrumb } from '../../../../../../core/src/shared/components/page-header/page-header.types';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';
import { KubernetesService } from '../../services/kubernetes.service';
import { KubeDashboardStatus } from '../../store/kubernetes.effects';

type MessageUpdater = (msg: string) => void;

@Component({
  selector: 'app-kubedash-configuration',
  templateUrl: './kubedash-configuration.component.html',
  styleUrls: ['./kubedash-configuration.component.scss'],
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

  public kubeDashboardStatus$: Observable<KubeDashboardStatus>;

  private snackBarRef: MatSnackBarRef<SimpleSnackBar>;

  public serviceAccountBusy$ = new BehaviorSubject<boolean>(false);
  public serviceAccountMsg = '';

  public dashboardUIBusy$ = new BehaviorSubject<boolean>(false);
  public dashboardUIMsg = '';

  // Are we busy with an operation - disable buttons if we are
  public isBusy$ = new BehaviorSubject<boolean>(false);

  // Is the status loading
  public isUpdatingStatus = false;

  private sub: Subscription;

  public isAzure$: Observable<boolean>;

  public dashboardLink: string;

  constructor(
    public kubeEndpointService: KubernetesEndpointService,
    private httpClient: HttpClient,
    private confirmDialog: ConfirmationDialogService,
    private snackBar: MatSnackBar,
  ) {
    this.kubeDashboardStatus$ = kubeEndpointService.kubeDashboardStatus$;
    // Clear the updating status when we get back new dashboard status
    this.sub = this.kubeDashboardStatus$.pipe(distinctUntilChanged()).subscribe(status => {
      if (status !== null) {
        this.isUpdatingStatus = false;
      }
    });

    this.dashboardLink = `/kubernetes/${kubeEndpointService.kubeGuid}/dashboard`;

    this.isAzure$ = this.kubeDashboardStatus$.pipe(
      filter(status => status !== null),
      filter(status => !!status.version),
      map(status => status.version.indexOf('azure') !== -1)
    );

    this.breadcrumbs$ = kubeEndpointService.endpoint$.pipe(
      map(endpoint => ([{
        breadcrumbs: [{ value: endpoint.entity.name, routerLink: `/kubernetes/${endpoint.entity.guid}` }]
      }]))
    );
  }

  ngOnDestroy() {
    if (this.snackBarRef) {
      this.snackBarRef.dismiss();
    }
    if (this.sub) {
      this.sub.unsubscribe();
    }
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
      this.serviceAccountBusy$,
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
      'An error occurred deleting the Service Account', this.serviceAccountBusy$,
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
      this.dashboardUIBusy$,
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
      this.dashboardUIBusy$,
      (msg) => this.dashboardUIMsg = msg
    );
  }

  private makeRequest(
    method: string,
    op: string,
    busyMsg: string,
    okMsg: string,
    errorMsg: string,
    busy: BehaviorSubject<boolean>,
    msgUpdater: MessageUpdater) {
    const guid = this.kubeEndpointService.kubeGuid;
    const url = `/pp/v1/kubedash/${guid}/${op}`;
    let obs;
    msgUpdater(busyMsg);
    busy.next(true);
    this.isBusy$.next(true);
    if (method === 'post') {
      obs = this.httpClient.post(url, {});
    } else if (method === 'delete') {
      obs = this.httpClient.delete(url, {});
    } else {
      console.error('Unsupported http method');
      return;
    }

    obs.subscribe(() => {
      this.snackBar.open(okMsg, 'Dismiss', { duration: 3000 });
      busy.next(false);
      this.refresh();
    }, (e) => {
      let msg = errorMsg;
      if (e && e.error && e.error.error) {
        msg = e.error.error;
      }
      this.snackBarRef = this.snackBar.open(msg, 'Dismiss');
      busy.next(false);
      this.refresh();
    });
  }

  private refresh() {
    this.isUpdatingStatus = true;
    this.kubeEndpointService.refreshKubernetesDashboardStatus();
    this.isBusy$.next(false);
  }
}
