import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription } from 'rxjs/Rx';

import { EntityInfo } from '../../../../store/actions/api.actions';
import { ApplicationData, ApplicationService } from '../../application.service';
import { AppMetadataInfo } from '../../../../store/actions/app-metadata.actions';

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

    this.cardTwoFetching$ = this.appService.application$
      .combineLatest(
      this.appService.appSummary$
      )
      .mergeMap(([app, { entity, entityRequestInfo }]: [ApplicationData, EntityInfo]) => {
        return Observable.of(app.fetching || entityRequestInfo.fetching);
      });
  }

}
