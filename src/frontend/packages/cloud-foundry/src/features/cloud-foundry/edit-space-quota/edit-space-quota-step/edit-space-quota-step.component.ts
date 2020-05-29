import { Component, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { filter, map, pairwise, tap } from 'rxjs/operators';

import { cfEntityCatalog } from '../../../../../../cloud-foundry/src/cf-entity-catalog';
import { ActiveRouteCfOrgSpace } from '../../../../../../cloud-foundry/src/features/cloud-foundry/cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../../../../../../cloud-foundry/src/features/cloud-foundry/cf.helpers';
import { safeUnsubscribe } from '../../../../../../core/src/core/utils.service';
import { StepOnNextFunction } from '../../../../../../core/src/shared/components/stepper/step/step.component';
import { AppState } from '../../../../../../store/src/app-state';
import { ActionState } from '../../../../../../store/src/reducers/api-request-reducer/types';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { ISpaceQuotaDefinition } from '../../../../cf-api.types';
import { SpaceQuotaDefinitionFormComponent } from '../../space-quota-definition-form/space-quota-definition-form.component';


@Component({
  selector: 'app-edit-space-quota-step',
  templateUrl: './edit-space-quota-step.component.html',
  styleUrls: ['./edit-space-quota-step.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider
  ]
})
export class EditSpaceQuotaStepComponent implements OnDestroy {

  spaceQuotaSubscription: Subscription;
  cfGuid: string;
  spaceQuotaGuid: string;
  allQuotas: string[];
  spaceQuotaDefinition$: Observable<APIResource<ISpaceQuotaDefinition>>;
  quota: ISpaceQuotaDefinition;

  @ViewChild('form')
  form: SpaceQuotaDefinitionFormComponent;

  constructor(
    private store: Store<AppState>,
    private activatedRoute: ActivatedRoute,
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace
  ) {

    this.cfGuid = this.activeRouteCfOrgSpace.cfGuid;
    this.spaceQuotaGuid = this.activatedRoute.snapshot.params.quotaId;

    this.fetchQuotaDefinition();
  }

  fetchQuotaDefinition() {
    this.spaceQuotaDefinition$ = cfEntityCatalog.spaceQuota.store.getEntityService(this.spaceQuotaGuid, this.cfGuid, {}).waitForEntity$.pipe(
      map(data => data.entity),
      tap((resource) => this.quota = resource.entity)
    );

    this.spaceQuotaSubscription = this.spaceQuotaDefinition$.subscribe();
  }

  validate = () => !!this.form && this.form.valid();

  submit: StepOnNextFunction = () =>
    cfEntityCatalog.spaceQuota.api.update<ActionState>(this.spaceQuotaGuid, this.cfGuid, this.form.formGroup.value).pipe(
      pairwise(),
      filter(([oldV, newV]) => oldV.busy && !newV.busy),
      map(([, newV]) => newV),
      map(requestInfo => ({
        success: !requestInfo.error,
        redirect: !requestInfo.error,
        message: requestInfo.error ? `Failed to update space quota: ${requestInfo.message}` : ''
      }))
    );


  ngOnDestroy() {
    safeUnsubscribe(this.spaceQuotaSubscription);
  }
}
