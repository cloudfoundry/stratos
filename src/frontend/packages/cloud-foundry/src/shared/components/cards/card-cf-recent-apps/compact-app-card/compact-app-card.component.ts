import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { ApplicationService } from '../../../../../../../cloud-foundry/src/features/applications/application.service';
import { ActiveRouteCfOrgSpace } from '../../../../../../../cloud-foundry/src/features/cloud-foundry/cf-page.types';
import { BREADCRUMB_URL_PARAM } from '../../../../../../../core/src/shared/components/breadcrumbs/breadcrumbs.types';
import { StratosStatus } from '../../../../../../../core/src/shared/shared.types';
import { ApplicationStateData, ApplicationStateService } from '../../../../services/application-state.service';


@Component({
  selector: 'app-compact-app-card',
  templateUrl: './compact-app-card.component.html',
  styleUrls: ['./compact-app-card.component.scss']
})
export class CompactAppCardComponent implements OnInit {

  @Input() app;

  applicationState$: Observable<ApplicationStateData>;

  appStatus$: Observable<StratosStatus>;

  bcType: any;


  constructor(
    private store: Store<CFAppState>,
    private appStateService: ApplicationStateService,
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,

  ) { }
  ngOnInit() {

    this.bcType = this.setBreadcrumbType(this.activeRouteCfOrgSpace);
    const initState = this.appStateService.get(this.app.entity, null);
    this.applicationState$ = ApplicationService.getApplicationState(
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

