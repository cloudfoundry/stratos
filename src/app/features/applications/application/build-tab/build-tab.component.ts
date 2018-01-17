import { AppState } from '../../../../store/app-state';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Rx';

import { ApplicationData, ApplicationService } from '../../application.service';
import { AppMetadataInfo } from '../../../../store/types/app-metadata.types';

import { UpdateApplication } from '../../../../store/actions/application.actions';
import { Store } from '@ngrx/store';

@Component({
  selector: 'app-build-tab',
  templateUrl: './build-tab.component.html',
  styleUrls: ['./build-tab.component.scss']
})
export class BuildTabComponent implements OnInit {
  constructor(private route: ActivatedRoute, private applicationService: ApplicationService, private store: Store<AppState>) { }

  appService = this.applicationService;

  cardTwoFetching$: Observable<boolean>;

  isEditSummary = false;

  public async: any;

  appEdits: UpdateApplication;
  appDefaultEdits: UpdateApplication = {
    enable_ssh: false,
    instances: 0,
    memory: 0,
    name: '',
    environment_json: {}
  };

  ngOnInit() {

    this.setAppDefaults();
    this.appEdits = { ... this.appDefaultEdits };

    // const { cfGuid, appGuid } = this.applicationService;

    this.cardTwoFetching$ = this.appService.application$
      .combineLatest(
      this.appService.appSummary$
      )
      .map(([app, appSummary]: [ApplicationData, AppMetadataInfo]) => {
        return app.fetching || appSummary.metadataRequestState.fetching.busy;
      }).distinct();
  }


  startEdit() {
    this.isEditSummary = true;
    this.setAppDefaults();
  }

  endEdit() {
    this.isEditSummary = false;
  }

  saveEdits() {
    this.endEdit();
    // this.applicationService.updateApplication(this.appEdits);
    console.log('APP UPDATE EDIT');
    console.log(this.appEdits);
  }

  setAppDefaults() {
    // this.appEdits = { ... this.appDefaultEdits };

  }
}
