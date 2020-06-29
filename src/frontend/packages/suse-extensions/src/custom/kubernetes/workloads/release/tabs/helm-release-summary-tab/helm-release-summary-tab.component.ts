import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { LoggerService } from 'frontend/packages/core/src/core/logger.service';
import { ConfirmationDialogConfig } from 'frontend/packages/core/src/shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from 'frontend/packages/core/src/shared/components/confirmation-dialog.service';
import { ClearPaginationOfType } from 'frontend/packages/store/src/actions/pagination.actions';
import { RouterNav } from 'frontend/packages/store/src/actions/router.actions';
import { AppState } from 'frontend/packages/store/src/app-state';
import { combineLatest, Observable, ReplaySubject } from 'rxjs';
import { distinctUntilChanged, filter, first, map, publishReplay, refCount, startWith } from 'rxjs/operators';

import { SnackBarService } from '../../../../../../../../core/src/shared/services/snackbar.service';
import { endpointsEntityRequestDataSelector } from '../../../../../../../../store/src/selectors/endpoint.selectors';
import { HelmReleaseChartData, HelmReleaseResource } from '../../../workload.types';
import { workloadsEntityCatalog } from '../../../workloads-entity-catalog';
import { HelmReleaseHelperService } from '../helm-release-helper.service';

@Component({
  selector: 'app-helm-release-summary-tab',
  templateUrl: './helm-release-summary-tab.component.html',
  styleUrls: ['./helm-release-summary-tab.component.scss']
})
export class HelmReleaseSummaryTabComponent implements OnDestroy {
  // Confirmation dialogs
  deleteReleaseConfirmation: ConfirmationDialogConfig;

  private busyDeletingSubject = new ReplaySubject<boolean>();
  public isBusy$: Observable<boolean>;
  public hasResources$: Observable<boolean>;
  public hasAllResources$: Observable<boolean>;
  private readonly DEFAULT_LOADING_MESSAGE = 'Retrieving Release Details';
  public loadingMessage = this.DEFAULT_LOADING_MESSAGE;

  public podsChartData = [];
  public containersChartData = [];

  private successChartColor = '#4DD3A7';
  private completedChartColour = '#7aa3e5';

  public podChartColors = [
    {
      name: 'Running',
      value: this.successChartColor
    },
    {
      name: 'Completed',
      value: this.completedChartColour
    },
  ];

  public containersChartColors = [
    {
      name: 'Ready',
      value: this.successChartColor
    },
    {
      name: 'Not Ready',
      value: '#E7727D'
    }
  ];


  public iconMappings = {
    Pod: {
      name: 'adjust'
    },
    Role: {
      name: 'lock'
    },
    RoleBinding: {
      name: 'lock'
    },
    ServiceAccount: {
      name: 'lock'
    },
    ReplicaSet: {
      name: 'filter_none'
    },
    default: {
      name: 'collocation',
      font: 'stratos-icons'
    }
  };

  // Blue: #00B2E2
  // Yellow: #FFC107

  private deleted = false;
  public chartData$: Observable<HelmReleaseChartData>;
  public resources$: Observable<HelmReleaseResource[]>;

  constructor(
    public helmReleaseHelper: HelmReleaseHelperService,
    private store: Store<AppState>,
    private confirmDialog: ConfirmationDialogService,
    private httpClient: HttpClient,
    private logService: LoggerService,
    private snackbarService: SnackBarService
  ) {

    this.isBusy$ = combineLatest([
      this.helmReleaseHelper.isFetching$,
      this.busyDeletingSubject.asObservable().pipe(
        startWith(false)
      )
    ]).pipe(
      map(([isFetching, isDeleting]) => isFetching || isDeleting),
      startWith(true)
    );

    this.chartData$ = this.helmReleaseHelper.fetchReleaseChartStats().pipe(
      distinctUntilChanged(),
      map(chartData => ({
        ...chartData,
        containersChartData: chartData.containersChartData.sort((a, b) => a.name.localeCompare(b.name)),
        podsChartData: chartData.podsChartData.sort((a, b) => a.name.localeCompare(b.name))
      })
      )
    );

    this.resources$ = this.helmReleaseHelper.fetchReleaseGraph().pipe(
      map((graph: any) => {
        const resources = {};
        // Collect the resources
        Object.values(graph.nodes).forEach((node: any) => {
          if (!resources[node.data.kind]) {
            resources[node.data.kind] = {
              kind: node.data.kind,
              label: `${node.data.kind}s`,
              count: 0,
              statuses: [],
              icon: this.getIcon(node.data.kind)
            };
          }
          resources[node.data.kind].count++;
          resources[node.data.kind].statuses.push(node.data.status);
        });
        return Object.values(resources).sort((a: any, b: any) => a.kind.localeCompare(b.kind));
      }),
      publishReplay(1),
      refCount()
    );

    this.hasResources$ = combineLatest([
      this.chartData$,
      this.resources$
    ]).pipe(
      map(([chartData, resources]) => !!chartData && !!resources)
    );

    this.hasAllResources$ = combineLatest([
      this.resources$,
      this.hasResources$
    ]).pipe(
      map(([resources, hasSome]) => hasSome && resources && resources.length > 0)
    );

    this.deleteReleaseConfirmation = new ConfirmationDialogConfig(
      `Delete Workload`,
      {
        textToMatch: helmReleaseHelper.releaseTitle
      },
      'Delete'
    );
  }

  private getIcon(kind: string) {
    const rkind = kind || 'Pod';
    if (this.iconMappings[rkind]) {
      return this.iconMappings[rkind];
    } else {
      return this.iconMappings.default;
    }
  }

  private startDelete() {
    this.loadingMessage = 'Deleting Release';
    this.busyDeletingSubject.next(true);
  }

  private endDelete() {
    this.loadingMessage = this.DEFAULT_LOADING_MESSAGE;
    this.busyDeletingSubject.next(false);
  }

  private completeDelete() {
    this.deleted = true;
    this.endDelete();
  }


  public deleteRelease() {
    this.confirmDialog.open(this.deleteReleaseConfirmation, () => {
      // Make the http request to delete the release
      const endpointAndName = this.helmReleaseHelper.guid.replace(':', '/').replace(':', '/');
      this.startDelete();
      this.httpClient.delete(`/pp/v1/helm/releases/${endpointAndName}`).subscribe({
        error: (err: any) => {
          this.endDelete();
          this.snackbarService.show('Failed to delete release', 'Close');
          this.logService.error('Failed to delete release: ', err);
        },
        complete: () => {
          const action = workloadsEntityCatalog.release.actions.getMultiple();
          this.store.dispatch(new ClearPaginationOfType(action));
          this.completeDelete();
          this.store.dispatch(new RouterNav({ path: ['workloads'] }));
        }
      });
    });
  }

  ngOnDestroy() {
    if (this.deleted) {
      this.snackbarService.hide();
    }
  }

  public createNamespaceLink(namespace: string): string[] {
    return [
      `/kubernetes`,
      this.helmReleaseHelper.endpointGuid,
      `namespaces`,
      namespace
    ];
  }

  public createClusterLink(): string[] {
    return [
      `/kubernetes`,
      this.helmReleaseHelper.endpointGuid,
    ];
  }

  public getClusterName(): Observable<string> {
    return this.store.select(endpointsEntityRequestDataSelector(this.helmReleaseHelper.endpointGuid)).pipe(
      filter(e => !!e),
      map(e => e.name),
      first()
    );
  }
}
