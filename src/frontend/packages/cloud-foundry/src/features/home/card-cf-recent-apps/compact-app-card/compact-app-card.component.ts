import { Component, Input, type OnInit , ChangeDetectionStrategy } from '@angular/core';
import { AsyncPipe, CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import type { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { BREADCRUMB_URL_PARAM, ApplicationStateIconComponent } from '@stratosui/core';
import type { StratosStatus, APIResource } from '@stratosui/store';
import type { CFAppState } from '../../../../cf-app-state';
import { type ApplicationStateData, ApplicationStateService } from '../../../../shared/services/application-state.service';
import { ApplicationService } from '../../../applications/application.service';
import { ActiveRouteCfOrgSpace } from '../../../cf/cf-page.types';
import type { IApp } from '../../../../cf-api-svc.types';


@Component({
  selector: 'app-compact-app-card',
  templateUrl: './compact-app-card.component.html',
  styleUrls: ['./compact-app-card.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    AsyncPipe,
    DatePipe,
    RouterModule,
    ApplicationStateIconComponent
  ]
})
export class CompactAppCardComponent implements OnInit {

  @Input() app!: APIResource<IApp> | { metadata: { guid: string }; entity: Record<string, unknown> };

  @Input() endpoint!: string;

  @Input() showDate = true;
  @Input() dateMode!: string;

  applicationState$!: Observable<ApplicationStateData>;

  appStatus$!: Observable<StratosStatus>;

  bcType!: Record<string, string>;


  constructor(_store: Store,
    private appStateService: ApplicationStateService,
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,

  ) { }
  ngOnInit() {
    if (this.activeRouteCfOrgSpace) {
      this.bcType = this.setBreadcrumbType(this.activeRouteCfOrgSpace);
      if (!this.endpoint) {
        this.endpoint = this.activeRouteCfOrgSpace.cfGuid;
      }
    }

    if (!this.app) {
      return;
    }

    const appEntity = this.app.entity as IApp;
    const initState = this.appStateService.get(appEntity, null);
    this.applicationState$ = ApplicationService.getApplicationState(
      this.appStateService,
      appEntity,
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
    if (activeRouteCfOrgSpace.cfGuid) {
      if (activeRouteCfOrgSpace.orgGuid) {
        bcType = 'org';
        if (activeRouteCfOrgSpace.spaceGuid) {
          bcType = 'space-summary';
        }
      }
    }
    return {
      [BREADCRUMB_URL_PARAM]: bcType
    };
  }
}

