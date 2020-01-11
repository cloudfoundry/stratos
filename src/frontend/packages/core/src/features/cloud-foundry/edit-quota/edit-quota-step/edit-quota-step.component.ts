import { Component, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { filter, first, map, pairwise, tap } from 'rxjs/operators';

import { CF_ENDPOINT_TYPE } from '../../../../../../cloud-foundry/src/cf-types';
import {
  GetQuotaDefinition,
  UpdateQuotaDefinition,
} from '../../../../../../cloud-foundry/src/actions/quota-definitions.actions';
import {
  QuotaDefinitionActionBuilder,
} from '../../../../../../cloud-foundry/src/entity-action-builders/quota-definition.action-builders';
import { ActiveRouteCfOrgSpace } from '../../../../../../cloud-foundry/src/features/cloud-foundry/cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../../../../../../cloud-foundry/src/features/cloud-foundry/cf.helpers';
import { AppState } from '../../../../../../store/src/app-state';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { IQuotaDefinition } from '../../../../core/cf-api.types';
import { entityCatalog } from '../../../../../../store/src/entity-catalog/entity-catalog.service';
import { IEntityMetadata } from '../../../../../../store/src/entity-catalog/entity-catalog.types';
import { EntityServiceFactory } from '../../../../../../store/src/entity-service-factory.service';
import { safeUnsubscribe } from '../../../../core/utils.service';
import { StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import { QuotaDefinitionFormComponent } from '../../quota-definition-form/quota-definition-form.component';
import { quotaDefinitionEntityType } from '../../../../../../cloud-foundry/src/cf-entity-types';


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
  quotaDefinition$: Observable<APIResource<IQuotaDefinition>>;
  quotaSubscription: Subscription;
  quota: IQuotaDefinition;

  @ViewChild('form', { static: false })
  form: QuotaDefinitionFormComponent;

  constructor(
    private store: Store<AppState>,
    private activatedRoute: ActivatedRoute,
    private entityServiceFactory: EntityServiceFactory,
    activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
  ) {
    this.cfGuid = activeRouteCfOrgSpace.cfGuid;
    this.quotaGuid = this.activatedRoute.snapshot.params.quotaId;

    this.fetchQuotaDefinition();
  }

  fetchQuotaDefinition() {
    this.quotaDefinition$ = this.entityServiceFactory.create<APIResource<IQuotaDefinition>>(
      this.quotaGuid,
      new GetQuotaDefinition(this.quotaGuid, this.cfGuid),
    ).waitForEntity$.pipe(
      first(),
      map(data => data.entity),
      tap((resource) => this.quota = resource.entity)
    );

    this.quotaSubscription = this.quotaDefinition$.subscribe();
  }

  validate = () => this.form && this.form.valid();

  submit: StepOnNextFunction = () => {
    const formValues = this.form.formGroup.value;
    const entityConfig =
      entityCatalog.getEntity<IEntityMetadata, any, QuotaDefinitionActionBuilder>(CF_ENDPOINT_TYPE, quotaDefinitionEntityType);
    entityConfig.actionDispatchManager.dispatchUpdate(this.quotaGuid, this.cfGuid, formValues);
    return entityConfig
      .getEntityMonitor(this.store, this.quotaGuid)
      .getUpdatingSection(UpdateQuotaDefinition.UpdateExistingQuota).pipe(
        pairwise(),
        filter(([oldV, newV]) => oldV.busy && !newV.busy),
        map(([, newV]) => newV),
        map(requestInfo => ({
          success: !requestInfo.error,
          redirect: !requestInfo.error,
          message: requestInfo.error ? `Failed to update quota: ${requestInfo.message}` : ''
        }))
      );
  }

  ngOnDestroy() {
    safeUnsubscribe(this.quotaSubscription);
  }
}
