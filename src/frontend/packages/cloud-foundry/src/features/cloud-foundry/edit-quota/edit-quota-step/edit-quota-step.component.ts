import { Component, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { filter, first, map, pairwise, tap } from 'rxjs/operators';

import { cfEntityCatalog } from '../../../../../../cloud-foundry/src/cf-entity-catalog';
import { ActiveRouteCfOrgSpace } from '../../../../../../cloud-foundry/src/features/cloud-foundry/cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../../../../../../cloud-foundry/src/features/cloud-foundry/cf.helpers';
import { safeUnsubscribe } from '../../../../../../core/src/core/utils.service';
import { StepOnNextFunction } from '../../../../../../core/src/shared/components/stepper/step/step.component';
import { AppState } from '../../../../../../store/src/app-state';
import { ActionState } from '../../../../../../store/src/reducers/api-request-reducer/types';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { IOrgQuotaDefinition } from '../../../../cf-api.types';
import { QuotaDefinitionFormComponent } from '../../quota-definition-form/quota-definition-form.component';


@Component({
  selector: 'app-edit-quota-step',
  templateUrl: './edit-quota-step.component.html',
  styleUrls: ['./edit-quota-step.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider
  ]
})
export class EditQuotaStepComponent implements OnDestroy {

  cfGuid: string;
  quotaGuid: string;
  quotaDefinition$: Observable<APIResource<IOrgQuotaDefinition>>;
  quotaSubscription: Subscription;
  quota: IOrgQuotaDefinition;

  @ViewChild('form')
  form: QuotaDefinitionFormComponent;

  constructor(
    private store: Store<AppState>,
    private activatedRoute: ActivatedRoute,
    activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
  ) {
    this.cfGuid = activeRouteCfOrgSpace.cfGuid;
    this.quotaGuid = this.activatedRoute.snapshot.params.quotaId;

    this.fetchQuotaDefinition();
  }

  fetchQuotaDefinition() {
    this.quotaDefinition$ = cfEntityCatalog.quotaDefinition.store.getEntityService(this.quotaGuid, this.cfGuid, {}).waitForEntity$.pipe(
      first(),
      map(data => data.entity),
      tap((resource) => this.quota = resource.entity)
    );

    this.quotaSubscription = this.quotaDefinition$.subscribe();
  }

  validate = () => this.form && this.form.valid();

  submit: StepOnNextFunction = () =>
    cfEntityCatalog.quotaDefinition.api.update<ActionState>(this.quotaGuid, this.cfGuid, this.form.formGroup.value).pipe(
      pairwise(),
      filter(([oldV, newV]) => oldV.busy && !newV.busy),
      map(([, newV]) => newV),
      map(requestInfo => ({
        success: !requestInfo.error,
        redirect: !requestInfo.error,
        message: requestInfo.error ? `Failed to update quota: ${requestInfo.message}` : ''
      }))
    );


  ngOnDestroy() {
    safeUnsubscribe(this.quotaSubscription);
  }
}
