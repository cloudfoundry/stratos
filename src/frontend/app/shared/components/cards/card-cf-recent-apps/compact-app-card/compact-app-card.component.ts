import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { map, startWith, tap } from 'rxjs/operators';
import { ApplicationStateData, CardStatus, ApplicationStateService } from '../../../application-state/application-state.service';
import { AppState } from '../../../../../store/app-state';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cloud-foundry/cf-page.types';
import { BREADCRUMB_URL_PARAM } from '../../../page-header/page-header.types';


@Component({
  selector: 'app-compact-app-card',
  templateUrl: './compact-app-card.component.html',
  styleUrls: ['./compact-app-card.component.scss']
})
export class CompactAppCardComponent implements OnInit {

  @Input('row') row;

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
    const initState = this.appStateService.get(this.row.entity, null);
    this.applicationState$ = ApplicationService.getApplicationState(
      this.store,
      this.appStateService,
      this.row.entity,
      this.row.metadata.guid,
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

