import { Component, inject, type OnDestroy, type OnInit , ChangeDetectionStrategy } from '@angular/core';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@stratosui/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { type Observable, of as observableOf, of, type Subscription } from 'rxjs';
import { filter, first, map, tap } from 'rxjs/operators';
import { AsyncPipe } from '@angular/common';
import type { GeneralEntityAppState } from '@stratosui/store';

import {
  DeleteDeployAppSection,
  StoreCFSettings,
} from '../../../actions/deploy-applications.actions';
import type { CFAppState } from '@stratosui/cloud-foundry';
import { getCFEntityKey } from '../../../cf-entity-helpers';
import { applicationEntityType } from '@stratosui/cloud-foundry';
import {
  selectApplicationSource,
  selectCfDetails,
} from '../../../store/selectors/deploy-application.selector';
import type { DeployApplicationSource, SourceType } from '../../../store/types/deploy-application.types';
import { RouterNav, selectPaginationState } from '@stratosui/store';
import { CfAppsDataSource } from '../../../shared/components/list/list-types/app/cf-apps-data-source';
import { CfOrgSpaceDataService } from '../../../shared/data-services/cf-org-space-service.service';
import { AUTO_SELECT_CF_URL_PARAM } from '../new-application-base-step/new-application-base-step.component';
import { ApplicationDeploySourceTypes } from './deploy-application-steps.types';
import { PageHeaderComponent, SteppersComponent, StepComponent, type StepOnNextFunction } from '@stratosui/core';
import { CreateApplicationStep1Component } from '../../../shared/components/create-application/create-application-step1/create-application-step1.component';
import { DeployApplicationStep2Component } from './deploy-application-step2/deploy-application-step2.component';
import { DeployApplicationStep21Component } from './deploy-application-step2-1/deploy-application-step2-1.component';
import { DeployApplicationStepSourceUploadComponent } from './deploy-application-step-source-upload/deploy-application-step-source-upload.component';
import { DeployApplicationOptionsStepComponent } from './deploy-application-options-step/deploy-application-options-step.component';
import { DeployApplicationStep3Component } from './deploy-application-step3/deploy-application-step3.component';

@Component({
  selector: 'app-deploy-application',
  templateUrl: './deploy-application.component.html',
  styleUrls: ['./deploy-application.component.scss'],
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

  appGuid: string;
  initCfOrgSpaceService: Subscription[] = [];
  deployButtonText = 'Deploy';
  skipConfig$: Observable<boolean> = observableOf(false);
  isRedeploy: boolean;
  selectedSourceType$: Observable<SourceType>;
  entityKey: string;
  private readonly store = inject(Store<GeneralEntityAppState>);
  private readonly cfOrgSpaceService = inject(CfOrgSpaceDataService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly appDeploySourceTypes = inject(ApplicationDeploySourceTypes);

  constructor() {
    this.entityKey = getCFEntityKey(applicationEntityType);
    this.appGuid = this.activatedRoute.snapshot.queryParams.appGuid;
    this.isRedeploy = !!this.appGuid;

    this.selectedSourceType$ = this.appDeploySourceTypes.getAutoSelectedType(this.activatedRoute);

    this.skipConfig$ = this.store.select<DeployApplicationSource>(selectApplicationSource).pipe(
      map((appSource: DeployApplicationSource) => {
        if (appSource?.type) {
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
    for (const p of this.initCfOrgSpaceService) {
      p.unsubscribe();
    }
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
          const items = pag.clientPagination.filter.items as { cf?: string; org?: string; space?: string };
          if (items.cf) {
            this.cfOrgSpaceService.cf.select.next(items.cf);
          }
          if (items.org) {
            this.cfOrgSpaceService.org.select.next(items.org);
          }
          if (items.space) {
            this.cfOrgSpaceService.space.select.next(items.space);
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
      first(),
      map(selectedSourceType => `Deploy ${selectedSourceType ? `from ${selectedSourceType.name}` : ''}`)
    );
  };
}

