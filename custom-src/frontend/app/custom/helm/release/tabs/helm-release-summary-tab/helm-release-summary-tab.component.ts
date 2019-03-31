import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf, combineLatest } from 'rxjs';
import { map, startWith, tap } from 'rxjs/operators';

import { ClearPaginationOfType } from '../../../../../../../store/src/actions/pagination.actions';
import { RouterNav } from '../../../../../../../store/src/actions/router.actions';
import { AppState } from '../../../../../../../store/src/app-state';
import { ConfirmationDialogConfig } from '../../../../../shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../../shared/components/confirmation-dialog.service';
import { helmReleasesSchemaKey } from '../../../store/helm.entities';
import { HelmReleaseHelperService } from '../helm-release-helper.service';

const podErrorStatus = {
  Failed: true,
  CrashLoopBackOff: true,
  ErrImgPull: true,
};

@Component({
  selector: 'app-helm-release-summary-tab',
  templateUrl: './helm-release-summary-tab.component.html',
  styleUrls: ['./helm-release-summary-tab.component.scss']
})
export class HelmReleaseSummaryTabComponent {

  // Confirmation dialogs
  deleteReleaseConfirmation = new ConfirmationDialogConfig(
    'Delete Release',
    'Are you sure you want to delete this Release?',
    'Delete'
  );

  public isBusy$: Observable<boolean>;

  public loadingMessage = 'Retrieving Release Details';

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

  public podsChartColors = [
    {
      name: 'OK',
      value: '#4DD3A7'
    },
    {
      name: 'Error',
      value: '#E7727D'
    }
  ];

  constructor(
    public helmReleaseHelper: HelmReleaseHelperService,
    private store: Store<AppState>,
    private confirmDialog: ConfirmationDialogService,
    private httpClient: HttpClient,
  ) {

    // Async fetch release status
    const fetchStatus = this.helmReleaseHelper.fetchReleaseStatus();
    const isStatusBusy$ = fetchStatus.pipe(map(d => false));
    this.isBusy$ = combineLatest(this.helmReleaseHelper.isFetching$, isStatusBusy$).pipe(
      map(([a, b]) => a || b)
    );

    fetchStatus.subscribe(data => {
      const chart = [];
      Object.keys(data.pods.status).forEach(status => {
        chart.push({
          name: status,
          value: data.pods.status[status]
        });
      });
      this.podsChartData = this.collatePodStatus(data);

      this.containersChartData = [
        {
          name: 'Ready',
          value: data.pods.ready
        },
        {
          name: 'Not Ready',
          value: data.pods.containers - data.pods.ready
        }
      ];
    });
  }

  private collatePodStatus(data: any): any {
    let okay = 0;
    let error = 0;

    Object.keys(data.pods.status).forEach(status => {
      if (podErrorStatus[status]) {
        error++;
      } else {
        okay++;
      }
    });

    return [
      {
        name: 'OK',
        value: okay
      },
      {
        name: 'Error',
        value: error
      }
    ];
  }

  public deleteRelease() {
    this.confirmDialog.open(this.deleteReleaseConfirmation, () => {
      // Make the http request to delete the release
      const endpointAndName = this.helmReleaseHelper.guid.replace(':', '/');
      const deleting$ = this.httpClient.delete(`/pp/v1/helm/releases/${endpointAndName}`);
      this.loadingMessage = 'Deleting Release';
      this.isBusy$ = deleting$.pipe(
        map(d => false),
        startWith(true),
      );

      deleting$.subscribe(d => {
        this.store.dispatch(new ClearPaginationOfType(helmReleasesSchemaKey));
        this.store.dispatch(new RouterNav({ path: ['monocular/releases'] }));
      },
        () => {
          this.isBusy$ = observableOf(false);
        });
    });
  }
}
