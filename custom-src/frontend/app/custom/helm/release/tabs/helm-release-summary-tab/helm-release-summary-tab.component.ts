import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, ReplaySubject, Subscription } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { ClearPaginationOfType } from '../../../../../../../store/src/actions/pagination.actions';
import { RouterNav } from '../../../../../../../store/src/actions/router.actions';
import { HideSnackBar, ShowSnackBar } from '../../../../../../../store/src/actions/snackBar.actions';
import { AppState } from '../../../../../../../store/src/app-state';
import { LoggerService } from '../../../../../core/logger.service';
import { safeUnsubscribe } from '../../../../../core/utils.service';
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
export class HelmReleaseSummaryTabComponent implements OnDestroy {
  // Confirmation dialogs
  deleteReleaseConfirmation = new ConfirmationDialogConfig(
    'Delete Release',
    'Are you sure you want to delete this Release?',
    'Delete'
  );

  private isBusy = new ReplaySubject<boolean>();
  public isBusy$: Observable<boolean> = this.isBusy.asObservable();

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

  private subs: Subscription[] = [];
  private deleted = false;

  constructor(
    public helmReleaseHelper: HelmReleaseHelperService,
    private store: Store<AppState>,
    private confirmDialog: ConfirmationDialogService,
    private httpClient: HttpClient,
    private logService: LoggerService
  ) {

    const releaseStatus$ = this.helmReleaseHelper.fetchReleaseStatus();

    this.subs.push(combineLatest([
      this.helmReleaseHelper.isFetching$,
      releaseStatus$
    ]).pipe(
      map(([isFetching, releaseStatus]) => isFetching || !releaseStatus),
      startWith(true)
    ).subscribe(busy => this.isBusy.next(busy)));

    // Async fetch release status
    this.subs.push(releaseStatus$.subscribe(data => {

      // Pods status (grouped)
      this.podsChartData = this.collatePodStatus(data);

      // Container Readiness
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
    }));
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
      this.loadingMessage = 'Deleting Release';
      this.isBusy.next(true);
      this.deleted = true;
      this.httpClient.delete(`/pp/v1/helm/releases/${endpointAndName}`).subscribe({
        next: () => {
          this.store.dispatch(new ClearPaginationOfType(helmReleasesSchemaKey));
          this.store.dispatch(new RouterNav({ path: ['monocular/releases'] }));
        },
        error: (err: any) => {
          this.store.dispatch(new ShowSnackBar('Failed to delete release', 'Close'));
          this.logService.error('Failed to delete release: ', err);
        },
        complete: () => this.isBusy.next(false)
      });
    });
  }

  ngOnDestroy() {
    safeUnsubscribe(...this.subs);
    if (this.deleted) {
      this.store.dispatch(new HideSnackBar());
    }
  }
}
