import { Component, OnInit } from '@angular/core';
import { Http } from '@angular/http';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Rx';

import { AppState } from '../../../../../../store/app-state';
import { EntityInfo } from '../../../../../../store/types/api.types';
import { AppSummary } from '../../../../../../store/types/app-metadata.types';
import { getFullEndpointApiUrl } from '../../../../../endpoints/endpoint-helpers';
import { ApplicationMonitorService } from '../../../../application-monitor.service';
import { ApplicationData, ApplicationService } from '../../../../application.service';
import { FetchCFMetricsAction, FetchApplicationMetricsAction } from '../../../../../../store/actions/metrics.actions';

@Component({
  selector: 'app-build-tab',
  templateUrl: './build-tab.component.html',
  styleUrls: ['./build-tab.component.scss'],
  providers: [
    ApplicationMonitorService,
  ]
})
export class BuildTabComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private applicationService: ApplicationService,
    private store: Store<AppState>
  ) { }

  appService = this.applicationService;

  cardTwoFetching$: Observable<boolean>;

  public async: any;

  getFullApiUrl = getFullEndpointApiUrl;

  ngOnInit() {
    this.cardTwoFetching$ = this.appService.application$
      .combineLatest(
        this.appService.appSummary$
      )
      .map(([app, appSummary]: [ApplicationData, EntityInfo<AppSummary>]) => {
        return app.fetching || appSummary.entityRequestInfo.fetching;
      }).distinct();
  }

  testMetrics() {
    console.log('TESTING METRICS.....');

    this.store.dispatch(new FetchCFMetricsAction(
      this.appService.cfGuid,
      'firehose_container_metric_memory_bytes{}')
    );
    this.store.dispatch(new FetchApplicationMetricsAction(
      this.appService.appGuid,
      this.appService.cfGuid,
      'firehose_value_metric_rep_container_count{}'
    )
    );
  }
}
