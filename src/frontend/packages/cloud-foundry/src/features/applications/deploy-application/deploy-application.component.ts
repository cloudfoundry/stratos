// FWT-957 DEFERRED: multi-step migration needs per-stepper signal service.
// Multi-step wizard (source-select → source-upload → options → step2 → step2-1
// → step3) with cross-step state in deploy-application.actions / selectors
// + GitHub branch/commit selection + manifest parsing. Parent (FWT-957)
// should introduce a DeployApplicationStepperService that exposes the
// shared state as signals before this consumer can adopt SignalStepHandle.
import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@stratosui/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf, of, Subscription } from 'rxjs';
import { take, filter, map, tap } from 'rxjs/operators';
import { AsyncPipe } from '@angular/common';

import {
  DeleteDeployAppSection,
  StoreCFSettings } from '../../../actions/deploy-applications.actions';
import { CFAppState } from '@stratosui/cloud-foundry';
import { getCFEntityKey } from '../../../cf-entity-helpers';
import { applicationEntityType } from '@stratosui/cloud-foundry';
import {
  selectApplicationSource,
  selectCfDetails } from '../../../store/selectors/deploy-application.selector';
import { DeployApplicationSource, SourceType } from '../../../store/types/deploy-application.types';
import { RouterNav, selectPaginationState } from '@stratosui/store';
import { CfAppsDataSource } from '../../../shared/components/list/list-types/app/cf-apps-data-source';
import { CfOrgSpaceDataService } from '../../../shared/data-services/cf-org-space-service.service';
import { AUTO_SELECT_CF_URL_PARAM } from '../new-application-base-step/new-application-base-step.component';
import { ApplicationDeploySourceTypes } from './deploy-application-steps.types';
import { PageHeaderComponent, SteppersComponent, StepComponent } from '@stratosui/core';
import { StepOnNextFunction } from '../../../../../core/src/shared/components/stepper/step/step.component';
import { CreateApplicationStep1Component } from '../../../shared/components/create-application/create-application-step1/create-application-step1.component';
import { DeployApplicationStep2Component } from './deploy-application-step2/deploy-application-step2.component';
import { DeployApplicationStep21Component } from './deploy-application-step2-1/deploy-application-step2-1.component';
import { DeployApplicationStepSourceUploadComponent } from './deploy-application-step-source-upload/deploy-application-step-source-upload.component';
import { DeployApplicationOptionsStepComponent } from './deploy-application-options-step/deploy-application-options-step.component';
import { DeployApplicationStep3Component } from './deploy-application-step3/deploy-application-step3.component';

@Component({
  selector: 'app-deploy-application',
  templateUrl: './deploy-application.component.html',
  providers: [
    CfOrgSpaceDataService,
    ApplicationDeploySourceTypes,
    { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher }
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    PageHeaderComponent,
    SteppersComponent,
    StepComponent,
    CreateApplicationStep1Component,
    DeployApplicationStep2Component,
    DeployApplicationStep21Component,
    DeployApplicationStepSourceUploadComponent,
    DeployApplicationOptionsStepComponent,
    DeployApplicationStep3Component
]
})
export class DeployApplicationComponent implements OnInit, OnDestroy {
  private store = inject<Store<CFAppState>>(Store);
  private cfOrgSpaceService = inject(CfOrgSpaceDataService);
  private activatedRoute = inject(ActivatedRoute);


  appGuid: string;
  initCfOrgSpaceService: Subscription[] = [];
  deployButtonText = 'Deploy';
  skipConfig$: Observable<boolean> = observableOf(false);
  isRedeploy: boolean;
  selectedSourceType$: Observable<SourceType>;
  entityKey: string;
  constructor() {
    const activatedRoute = this.activatedRoute;
    const appDeploySourceTypes = inject(ApplicationDeploySourceTypes);

    this.entityKey = getCFEntityKey(applicationEntityType);
    this.appGuid = this.activatedRoute.snapshot.queryParams.appGuid;
    this.isRedeploy = !!this.appGuid;

    this.selectedSourceType$ = appDeploySourceTypes.getAutoSelectedType(activatedRoute);

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
  };

  ngOnDestroy(): void {
    this.initCfOrgSpaceService.forEach(p => p.unsubscribe());
  }

  ngOnInit(): void {
    // Has the endpoint ID been specified in the URL?
    const endpoint = this.activatedRoute.snapshot.queryParams[AUTO_SELECT_CF_URL_PARAM];
    if (endpoint) {
      this.cfOrgSpaceService.cf.select.next(endpoint);
    }

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
        tap(_p => {
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

  getTitle = (): Observable<string> => {
    if (this.appGuid) {
      return of('Redeploy');
    }
    return this.selectedSourceType$.pipe(
      take(1),
      map(selectedSourceType => `Deploy ${selectedSourceType ? 'from ' + selectedSourceType.name : ''}`)
    );
  };
}

