import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { BREADCRUMB_URL_PARAM } from '../../../../../../core/src/shared/components/breadcrumbs/breadcrumbs.types';
import { StratosStatus } from '../../../../../../store/src/types/shared.types';
import { CFAppState } from '../../../../cf-app-state';
import { ApplicationStateData, ApplicationStateService } from '../../../../shared/services/application-state.service';
import { ApplicationService } from '../../../applications/application.service';
import { ActiveRouteCfOrgSpace } from '../../../cf/cf-page.types';


@Component({
  selector: 'app-compact-app-card',
  templateUrl: './compact-app-card.component.html',
  styleUrls: ['./compact-app-card.component.scss']
})
export class CompactAppCardComponent implements OnInit {

  @Input() app;

  @Input() endpoint: string;

  @Input() showDate = true;
  @Input() dateMode: string;

  applicationState$: Observable<ApplicationStateData>;

  appStatus$: Observable<StratosStatus>;

  bcType: any;


  constructor(
    private store: Store<CFAppState>,
    private appStateService: ApplicationStateService,
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,

  ) { }
  ngOnInit() {
    if(this.activeRouteCfOrgSpace) {
      this.bcType = this.setBreadcrumbType(this.activeRouteCfOrgSpace);
      if (!this.endpoint) {
        this.endpoint = this.activeRouteCfOrgSpace.cfGuid;
      }
    }

    if (!this.app) {
      return
    }

    const initState = this.appStateService.get(this.app.entity, null);
    this.applicationState$ = ApplicationService.getApplicationState(
      this.appStateService,
      this.app.entity,
      this.app.metadata.guid,
      this.endpoint
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

