import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { combineLatest, distinct, map } from 'rxjs/operators';

import { EntityInfo } from '../../../../../../store/types/api.types';
import { AppSummary } from '../../../../../../store/types/app-metadata.types';
import { getFullEndpointApiUrl } from '../../../../../endpoints/endpoint-helpers';
import { ApplicationMonitorService } from '../../../../application-monitor.service';
import { ApplicationData, ApplicationService } from '../../../../application.service';


@Component({
  selector: 'app-build-tab',
  templateUrl: './build-tab.component.html',
  styleUrls: ['./build-tab.component.scss'],
  providers: [
    ApplicationMonitorService,
  ]
})
export class BuildTabComponent implements OnInit {


  constructor(public applicationService: ApplicationService) { }

  cardTwoFetching$: Observable<boolean>;

  public async: any;

  getFullApiUrl = getFullEndpointApiUrl;

  sshStatus$: Observable<string>;

  ngOnInit() {
    this.cardTwoFetching$ = this.applicationService.application$.pipe(
      combineLatest(
        this.applicationService.appSummary$
      ),
      map(([app, appSummary]: [ApplicationData, EntityInfo<AppSummary>]) => {
        return app.fetching || appSummary.entityRequestInfo.fetching;
      }), distinct());

    this.sshStatus$ = this.applicationService.application$.pipe(
      combineLatest(this.applicationService.appSpace$),
      map(([app, space]) => {
        if (!space.entity.allow_ssh) {
          return 'Disabled by the space';
        } else {
          return app.app.entity.enable_ssh ? 'Yes' : 'No';
        }
      })
    );
  }
}
