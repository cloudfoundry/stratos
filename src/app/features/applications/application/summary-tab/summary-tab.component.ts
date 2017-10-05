import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Rx';

import { EntityInfo } from '../../../../store/actions/api.actions';
import { AppMetadataInfo } from '../../../../store/actions/app-metadata.actions';
import { ApplicationData, ApplicationService } from '../../application.service';

interface ApplicationEdits {
  name: string;
  instances: number;
  memory: number;
  enable_ssh: boolean;
}

@Component({
  selector: 'app-summary-tab',
  templateUrl: './summary-tab.component.html',
  styleUrls: ['./summary-tab.component.scss']
})
export class SummaryTabComponent implements OnInit {

  constructor(private route: ActivatedRoute, private applicationService: ApplicationService) { }

  isEditSummary: boolean;

  appService = this.applicationService;

  cardOneFetching$: Observable<boolean>;
  cardTwoFetching$: Observable<boolean>;
  appEdits: ApplicationEdits;
  appDefaultEdits: ApplicationEdits;

  setAppDefaults() {
    this.appEdits = { ... this.appDefaultEdits };
  }

  ngOnInit() {

    this.appEdits = {
      name: '',
      instances: 0,
      memory: 0,
      enable_ssh: false
    };

    this.cardOneFetching$ = this.appService.app$
      .combineLatest(
      this.appService.appEnvVars$,
      this.appService.appStatsGated$
      ).mergeMap(([app, appEnvVars, appStatsGated]: [EntityInfo, AppMetadataInfo, AppMetadataInfo]) => {
        return Observable.of(app.entityRequestInfo.fetching || appEnvVars.metadataRequestState.fetching ||
          appStatsGated.metadataRequestState.fetching);
      });

    this.cardTwoFetching$ = this.appService.application$
      .combineLatest(
      this.appService.appSummary$
      )
      .mergeMap(([app, { entity, entityRequestInfo }]: [ApplicationData, EntityInfo]) => {
        return Observable.of(app.fetching || entityRequestInfo.fetching);
      });

    this.cardOneFetching$
      .filter((isFetching) => {
        return !isFetching;
      })
      .mergeMap(_ => {
        return Observable.combineLatest(this.appService.application$, this.appService.appSummary$);
      })
      .subscribe(([application, appSummary]: [ApplicationData, EntityInfo]) => {
        this.appDefaultEdits = {
          name: application.app.entity.name,
          instances: appSummary.entity.entity.instances,
          memory: application.app.entity.memory,
          enable_ssh: application.app.entity.enable_ssh
        };
      });
    //
  }

  SaveApplication(application) {
    // console.log('SAVING: ', application);
    // // setTimeout(_ = > {
    // //   this.isEditSummary = false;
    // // }, 1);
    // setTimeout(_ => this.isEditSummary = false, 5000);
    // this.isEditSummary = false;

  }
}
