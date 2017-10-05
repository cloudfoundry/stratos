import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Rx';

import { EntityInfo } from '../../../../store/actions/api.actions';
import { AppMetadataInfo } from '../../../../store/actions/app-metadata.actions';
import { ApplicationData, ApplicationService } from '../../application.service';

@Component({
  selector: 'app-summary-tab',
  templateUrl: './summary-tab.component.html',
  styleUrls: ['./summary-tab.component.scss']
})
export class SummaryTabComponent implements OnInit {

  constructor(private route: ActivatedRoute, private applicationService: ApplicationService) { }

  appService = this.applicationService;
  cardOneFetching$: Observable<boolean>;
  cardTwoFetching$: Observable<boolean>;

  ngOnInit() {
    this.cardOneFetching$ = this.appService.app$.combineLatest(
      this.appService.appEnvVars$,
      this.appService.appStatsGated$
    ).mergeMap(([app, appEnvVars, appStatsGated]: [EntityInfo, AppMetadataInfo, AppMetadataInfo]) => {
      return Observable.of(app.entityRequestInfo.fetching || appEnvVars.metadataRequestState.fetching ||
        appStatsGated.metadataRequestState.fetching);
    });

    this.cardTwoFetching$ = this.appService.application$.combineLatest(
      this.appService.appSummary$
    )
      .mergeMap(([app, { entity, entityRequestInfo }]: [ApplicationData, EntityInfo]) => {
        return Observable.of(app.fetching || entityRequestInfo.fetching);
      });
  }

}
