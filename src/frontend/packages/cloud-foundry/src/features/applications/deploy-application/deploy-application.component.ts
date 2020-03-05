import { Component, OnDestroy, OnInit } from '@angular/core';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@angular/material/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf, Subscription } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';

import {
  DeleteDeployAppSection,
  StoreCFSettings,
} from '../../../../../cloud-foundry/src/actions/deploy-applications.actions';
import { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import { getCFEntityKey } from '../../../../../cloud-foundry/src/cf-entity-helpers';
import { applicationEntityType } from '../../../../../cloud-foundry/src/cf-entity-types';
import {
  selectApplicationSource,
  selectCfDetails,
} from '../../../../../cloud-foundry/src/store/selectors/deploy-application.selector';
import { DeployApplicationSource, SourceType } from '../../../../../cloud-foundry/src/store/types/deploy-application.types';
import { StepOnNextFunction } from '../../../../../core/src/shared/components/stepper/step/step.component';
import { RouterNav } from '../../../../../store/src/actions/router.actions';
import { selectPaginationState } from '../../../../../store/src/selectors/pagination.selectors';
import { CfAppsDataSource } from '../../../shared/components/list/list-types/app/cf-apps-data-source';
import { CfOrgSpaceDataService } from '../../../shared/data-services/cf-org-space-service.service';
import { ApplicationDeploySourceTypes } from './deploy-application-steps.types';

@Component({
  selector: 'app-deploy-application',
  templateUrl: './deploy-application.component.html',
  styleUrls: ['./deploy-application.component.scss'],
  providers: [
    CfOrgSpaceDataService,
    { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher }
  ],
})
export class DeployApplicationComponent implements OnInit, OnDestroy {

  appGuid: string;
  initCfOrgSpaceService: Subscription[] = [];
  deployButtonText = 'Deploy';
  skipConfig$: Observable<boolean> = observableOf(false);
  isRedeploy: boolean;
  selectedSourceType: SourceType;
  entityKey: string;
  constructor(
    private store: Store<CFAppState>,
    private cfOrgSpaceService: CfOrgSpaceDataService,
    private activatedRoute: ActivatedRoute,
    appDeploySourceTypes: ApplicationDeploySourceTypes
  ) {
    this.entityKey = getCFEntityKey(applicationEntityType);
    this.appGuid = this.activatedRoute.snapshot.queryParams.appGuid;
    this.isRedeploy = !!this.appGuid;

    this.selectedSourceType = appDeploySourceTypes.getAutoSelectedType(activatedRoute);

    this.skipConfig$ = this.store.select<DeployApplicationSource>(selectApplicationSource).pipe(
      map((appSource: DeployApplicationSource) => {
        if (appSource && appSource.type) {
          return appSource.type.id === 'giturl';
        }
        return false;
      })
    );
  }

  onNext: StepOnNextFunction = () => {
    this.store.dispatch(new StoreCFSettings({
      cloudFoundry: this.cfOrgSpaceService.cf.select.getValue(),
      org: this.cfOrgSpaceService.org.select.getValue(),
      space: this.cfOrgSpaceService.space.select.getValue()
    }));
    return observableOf({ success: true });
  }

  ngOnDestroy(): void {
    this.initCfOrgSpaceService.forEach(p => p.unsubscribe());
  }

  ngOnInit(): void {

    if (this.appGuid) {
      this.deployButtonText = 'Redeploy';
      this.initCfOrgSpaceService.push(this.store.select(selectCfDetails).pipe(
        filter(p => !!p),
        tap(p => {
          this.cfOrgSpaceService.cf.select.next(p.cloudFoundry);
          this.cfOrgSpaceService.org.select.next(p.org);
          this.cfOrgSpaceService.space.select.next(p.space);
        })
      ).subscribe());
      // In case user has specified the query param manually
      this.initCfOrgSpaceService.push(this.store.select(selectCfDetails).pipe(
        filter(p => !p),
        tap(p => {
          this.store.dispatch(new RouterNav({ path: ['applications', 'deploy'] }));
        })
      ).subscribe());
    } else {
      this.initCfOrgSpaceService.push(this.store.select(selectPaginationState(this.entityKey, CfAppsDataSource.paginationKey)).pipe(
        filter((pag) => !!pag),
        tap(pag => {
          const { cf, org, space } = pag.clientPagination.filter.items;
          if (cf) {
            this.cfOrgSpaceService.cf.select.next(cf);
          }
          if (org) {
            this.cfOrgSpaceService.org.select.next(org);
          }
          if (space) {
            this.cfOrgSpaceService.space.select.next(space);
          }
        })
      ).subscribe());
      // Delete any state in deployApplication
      this.store.dispatch(new DeleteDeployAppSection());
    }
  }

  getTitle = () => {
    if (this.appGuid) {
      return 'Redeploy';
    } else {
      return `Deploy ${this.selectedSourceType ? 'from ' + this.selectedSourceType.name : ''}`;
    }
  }
}

