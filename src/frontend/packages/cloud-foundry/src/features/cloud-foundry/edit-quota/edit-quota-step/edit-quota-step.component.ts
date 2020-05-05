import { Component, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { filter, first, map, pairwise, tap } from 'rxjs/operators';

import { safeUnsubscribe } from '../../../../../../core/src/core/utils.service';
import { StepOnNextFunction } from '../../../../../../core/src/shared/components/stepper/step/step.component';
import { AppState } from '../../../../../../store/src/app-state';
import { entityCatalog } from '../../../../../../store/src/entity-catalog/entity-catalog.service';
import { IEntityMetadata } from '../../../../../../store/src/entity-catalog/entity-catalog.types';
import { EntityServiceFactory } from '../../../../../../store/src/entity-service-factory.service';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { GetQuotaDefinition, UpdateQuotaDefinition } from '../../../../actions/quota-definitions.actions';
import { IQuotaDefinition } from '../../../../cf-api.types';
import { quotaDefinitionEntityType } from '../../../../cf-entity-types';
import { CF_ENDPOINT_TYPE } from '../../../../cf-types';
import { QuotaDefinitionActionBuilder } from '../../../../entity-action-builders/quota-definition.action-builders';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../../cf.helpers';
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
