import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { ApplicationService } from '../../../../../features/applications/application.service';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cloud-foundry/cf-page.types';
import { AppState } from '../../../../../store/app-state';
import { CardStatus } from '../../../../shared.types';
import { ApplicationStateData, ApplicationStateService } from '../../../application-state/application-state.service';
import { BREADCRUMB_URL_PARAM } from '../../../page-header/page-header.types';


@Component({
  selector: 'app-compact-app-card',
  templateUrl: './compact-app-card.component.html',
  styleUrls: ['./compact-app-card.component.scss']
})
export class CompactAppCardComponent implements OnInit {

  @Input() app;

  applicationState$: Observable<ApplicationStateData>;

  appStatus$: Observable<CardStatus>;

  bcType: any;


  constructor(
    private store: Store<AppState>,
    private appStateService: ApplicationStateService,
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace
  ) { }
  ngOnInit() {

    this.bcType = this.setBreadcrumbType(this.activeRouteCfOrgSpace);
    const initState = this.appStateService.get(this.app.entity, null);
    this.applicationState$ = ApplicationService.getApplicationState(
      this.store,
      this.appStateService,
      this.app.entity,
      this.app.metadata.guid,
      this.activeRouteCfOrgSpace.cfGuid
    ).pipe(
      startWith(initState)
    );
    this.appStatus$ = this.applicationState$.pipe(
      map(state => state.indicator)
    );
  }

  private setBreadcrumbType = (activeRouteCfOrgSpace: ActiveRouteCfOrgSpace) => {
    let bcType = 'cf';
    if (!!activeRouteCfOrgSpace.cfGuid) {
      if (!!activeRouteCfOrgSpace.orgGuid) {
        bcType = 'org';
        if (!!activeRouteCfOrgSpace.spaceGuid) {
          bcType = 'space-summary';
        }
      }
    }
    return {
      [BREADCRUMB_URL_PARAM]: bcType
    };
  }
}

