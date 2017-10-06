import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription } from 'rxjs/Rx';

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
export class SummaryTabComponent implements OnInit, OnDestroy {
  constructor(private route: ActivatedRoute, private applicationService: ApplicationService) { }

  isEditSummary: boolean;

  appService = this.applicationService;

  cardOneFetching$: Observable<boolean>;
  cardTwoFetching$: Observable<boolean>;
  appEdits: ApplicationEdits;
  appDefaultEdits: ApplicationEdits;

  sub: Subscription;

  setAppDefaults() {
    this.appEdits = { ... this.appDefaultEdits };
  }

  SaveApplication(application) {
    // console.log('SAVING: ', application);
    // // setTimeout(_ = > {
    // //   this.isEditSummary = false;
    // // }, 1);
    // setTimeout(_ => this.isEditSummary = false, 5000);
    // this.isEditSummary = false;

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
      ).map(([app, appEnvVars, appStatsGated]: [EntityInfo, AppMetadataInfo, any]) => {
        const isFetching = app.entityRequestInfo.fetching || appEnvVars.metadataRequestState.fetching ||
          appStatsGated ? appStatsGated.metadataRequestState.fetching : false;
        const isUpdating =
          console.log('cardOneFetching: ', app.entityRequestInfo.fetching || appEnvVars.metadataRequestState.fetching ||
            appStatsGated ? appStatsGated.metadataRequestState.fetching : false);
        return isFetching || isUpdating;
      });

    this.cardTwoFetching$ = this.appService.application$
      .combineLatest(
      this.appService.appSummary$
      )
      .mergeMap(([app, { entity, entityRequestInfo }]: [ApplicationData, EntityInfo]) => {
        return Observable.of(app.fetching || entityRequestInfo.fetching);
      });

    this.sub = this.cardOneFetching$
      .filter((isFetching) => {
        console.log('sub: filter: ', !isFetching);
        return !isFetching;
      })
      .mergeMap(_ => {
        return Observable.combineLatest(this.appService.application$, this.appService.appSummary$);
      })
      .subscribe(([application, appSummary]: [ApplicationData, EntityInfo]) => {
        console.log('sub: subscribe: ');
        this.appDefaultEdits = {
          name: application.app.entity.name,
          instances: appSummary.entity.entity.instances,
          memory: application.app.entity.memory,
          enable_ssh: application.app.entity.enable_ssh
        };
      });
    //
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

}
