import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, ReplaySubject, of as obsOf, Subject, BehaviorSubject } from 'rxjs';
import { map, startWith, catchError, share, filter } from 'rxjs/operators';

import websocketConnect from 'rxjs-websockets';

import { ClearPaginationOfType } from '../../../../../../../store/src/actions/pagination.actions';
import { RouterNav } from '../../../../../../../store/src/actions/router.actions';
import { HideSnackBar, ShowSnackBar } from '../../../../../../../store/src/actions/snackBar.actions';
import { AppState } from '../../../../../../../store/src/app-state';
import { entityCatalogue } from '../../../../../core/entity-catalogue/entity-catalogue.service';
import { LoggerService } from '../../../../../core/logger.service';
import { ConfirmationDialogConfig } from '../../../../../shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../../shared/components/confirmation-dialog.service';
import { HELM_ENDPOINT_TYPE, helmReleaseEntityKey } from '../../../helm-entity-factory';
import { HelmReleaseHelperService } from '../helm-release-helper.service';
import { HelmReleaseStatus, HELM_INSTALLING_KEY } from '../../../store/helm.types';
import { EntityRequestAction } from '../../../../../../../store/src/types/request.types';

@Component({
  selector: 'app-helm-release-summary-tab',
  templateUrl: './helm-release-summary-tab.component.html',
  styleUrls: ['./helm-release-summary-tab.component.scss']
})
export class HelmReleaseSummaryTabComponent implements OnDestroy {
  // Confirmation dialogs
  deleteReleaseConfirmation = new ConfirmationDialogConfig(
    'Delete Release',
    'Are you sure you want to delete this Release?',
    'Delete'
  );

  private busyDeletingSubject = new ReplaySubject<boolean>();
  public isBusy$: Observable<boolean>;
  private readonly DEFAULT_LOADING_MESSAGE = 'Retrieving Release Details';
  public loadingMessage = this.DEFAULT_LOADING_MESSAGE;

  public podsChartData = [];
  public containersChartData = [];

  public containersChartColors = [
    {
      name: 'Ready',
      value: '#4DD3A7'
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


  public resources$: Observable<any>;

  // Blue: #00B2E2
  // Yellow: #FFC107

  private deleted = false;
  public chartData$: Observable<{ podsChartData: { name: string; value: any; }[]; containersChartData: { name: string; value: any; }[]; }>;

  constructor(
    public helmReleaseHelper: HelmReleaseHelperService,
    private store: Store<AppState>,
    private confirmDialog: ConfirmationDialogService,
    private httpClient: HttpClient,
    private logService: LoggerService
  ) {

    //const releaseStatus$ = this.helmReleaseHelper.fetchReleaseStatus();

    const releaseStatus$ = new BehaviorSubject<HelmReleaseStatus>({} as HelmReleaseStatus);
    //.helmReleaseHelper.fetchReleaseStatus();






    this.isBusy$ = combineLatest([
      this.helmReleaseHelper.isFetching$,
      releaseStatus$,
      this.busyDeletingSubject.asObservable().pipe(
        startWith(false)
      )
    ]).pipe(
      map(([isFetching, releaseStatus, isDeleting]) => isFetching || !releaseStatus || isDeleting),
      startWith(true)
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
      })
    );

    // Async fetch release status
    // this.chartData$ = obsOf({});
    // this.chartData$ = releaseStatus$.pipe(
    //   map(data => ({
    //     podsChartData: Object.keys(data.pods.status).map(status => ({
    //       name: status,
    //       value: data.pods.status[status]
    //     })),
    //     containersChartData: [
    //       {
    //         name: 'Ready',
    //         value: data.pods.ready
    //       },
    //       {
    //         name: 'Not Ready',
    //         value: data.pods.containers - data.pods.ready
    //       }
    //     ]
    //   }))
    // );
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
      const releaseRef = this.helmReleaseHelper.guidAsUrlFragment();
      this.startDelete();
      this.httpClient.delete(`/pp/v1/helm/releases/${releaseRef}`).subscribe({
        error: (err: any) => {
          this.endDelete();
          this.store.dispatch(new ShowSnackBar('Failed to delete release', 'Close'));
          this.logService.error('Failed to delete release: ', err);
        },
        complete: () => {
          // Just need an action to clear the pagination for the Helm releases
          const apiAction = {
            endpointType: HELM_ENDPOINT_TYPE,
            entityType: helmReleaseEntityKey,
            guid: this.helmReleaseHelper.guid,
            type: null,
            updatingKey: HELM_INSTALLING_KEY
          } as EntityRequestAction;

          this.store.dispatch(new ClearPaginationOfType(apiAction));
          this.completeDelete();
          this.store.dispatch(new RouterNav({ path: ['monocular/releases'] }));
        }
      });
    });
  }

  ngOnDestroy() {
    if (this.deleted) {
      this.store.dispatch(new HideSnackBar());
    }
  }
}
