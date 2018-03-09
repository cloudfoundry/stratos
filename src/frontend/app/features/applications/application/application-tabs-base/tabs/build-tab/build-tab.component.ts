import { AppState } from '../../../../../../store/app-state';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Rx';

import { ApplicationData, ApplicationService } from '../../../../application.service';
import { EntityInfo } from '../../../../../../store/types/api.types';
import { AppSummary } from '../../../../../../store/types/app-metadata.types';

import { Store } from '@ngrx/store';
import { ApplicationMonitorService } from '../../../../application-monitor.service';
import { getFullEndpointApiUrl } from '../../../../../endpoints/endpoint-helpers';

@Component({
  selector: 'app-build-tab',
  templateUrl: './build-tab.component.html',
  styleUrls: ['./build-tab.component.scss'],
  providers: [
    ApplicationMonitorService,
  ]
})
export class BuildTabComponent implements OnInit {
  constructor(private route: ActivatedRoute, public applicationService: ApplicationService, private store: Store<AppState>) { }

  cardTwoFetching$: Observable<boolean>;

  public async: any;

  getFullApiUrl = getFullEndpointApiUrl;

  ngOnInit() {
    this.cardTwoFetching$ = this.applicationService.application$
      .combineLatest(
      this.applicationService.appSummary$
      )
      .map(([app, appSummary]: [ApplicationData, EntityInfo<AppSummary>]) => {
        return app.fetching || appSummary.entityRequestInfo.fetching;
      }).distinct();
  }
}
