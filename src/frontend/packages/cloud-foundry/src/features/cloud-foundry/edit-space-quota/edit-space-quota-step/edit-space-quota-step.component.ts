import { Component, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { filter, map, pairwise, tap } from 'rxjs/operators';

import { safeUnsubscribe } from '../../../../../../core/src/core/utils.service';
import { StepOnNextFunction } from '../../../../../../core/src/shared/components/stepper/step/step.component';
import { AppState } from '../../../../../../store/src/app-state';
import { entityCatalog } from '../../../../../../store/src/entity-catalog/entity-catalog.service';
import { IEntityMetadata } from '../../../../../../store/src/entity-catalog/entity-catalog.types';
import { EntityServiceFactory } from '../../../../../../store/src/entity-service-factory.service';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { GetSpaceQuotaDefinition, UpdateSpaceQuotaDefinition } from '../../../../actions/quota-definitions.actions';
import { IQuotaDefinition } from '../../../../cf-api.types';
import { spaceQuotaEntityType } from '../../../../cf-entity-types';
import { CF_ENDPOINT_TYPE } from '../../../../cf-types';
import { SpaceQuotaDefinitionActionBuilders } from '../../../../entity-action-builders/space-quota.action-builders';
import { SpaceQuotaDefinitionFormComponent } from '../../space-quota-definition-form/space-quota-definition-form.component';


@Component({
  selector: 'app-edit-space-quota-step',
  templateUrl: './edit-space-quota-step.component.html',
  styleUrls: ['./edit-space-quota-step.component.scss']
})
export class EditSpaceQuotaStepComponent implements OnDestroy {

  spaceQuotaSubscription: Subscription;
  cfGuid: string;
  spaceQuotaGuid: string;
  allQuotas: string[];
  spaceQuotaDefinition$: Observable<APIResource<IQuotaDefinition>>;
  quota: IQuotaDefinition;

  @ViewChild('form', { static: false })
  form: SpaceQuotaDefinitionFormComponent;

  constructor(
    private store: Store<AppState>,
    private activatedRoute: ActivatedRoute,
    private entityServiceFactory: EntityServiceFactory,
  ) {
    this.cfGuid = this.activatedRoute.snapshot.params.endpointId;
    this.spaceQuotaGuid = this.activatedRoute.snapshot.params.quotaId;

    this.fetchQuotaDefinition();
  }

  fetchQuotaDefinition() {
    this.spaceQuotaDefinition$ = this.entityServiceFactory.create<APIResource<IQuotaDefinition>>(
      this.spaceQuotaGuid,
      new GetSpaceQuotaDefinition(this.spaceQuotaGuid, this.cfGuid),
    ).waitForEntity$.pipe(
      map(data => data.entity),
      tap((resource) => this.quota = resource.entity)
    );

    this.spaceQuotaSubscription = this.spaceQuotaDefinition$.subscribe();
  }

  validate = () => !!this.form && this.form.valid();

  submit: StepOnNextFunction = () => {
    const formValues = this.form.formGroup.value;
    const action = new UpdateSpaceQuotaDefinition(this.spaceQuotaGuid, this.cfGuid, formValues);
    this.store.dispatch(action);

    const entityConfig =
      entityCatalog.getEntity<IEntityMetadata, any, SpaceQuotaDefinitionActionBuilders>(CF_ENDPOINT_TYPE, spaceQuotaEntityType);
    entityConfig.actionDispatchManager.dispatchUpdate(this.spaceQuotaGuid, this.cfGuid, formValues);

    return entityConfig
      .getEntityMonitor(this.store, this.spaceQuotaGuid)
      .getUpdatingSection(UpdateSpaceQuotaDefinition.UpdateExistingSpaceQuota)
      .pipe(
        pairwise(),
        filter(([oldV, newV]) => oldV.busy && !newV.busy),
        map(([, newV]) => newV),
        map(requestInfo => ({
          success: !requestInfo.error,
          redirect: !requestInfo.error,
          message: requestInfo.error ? `Failed to update space quota: ${requestInfo.message}` : ''
        }))
      );
  }

  ngOnDestroy() {
    safeUnsubscribe(this.spaceQuotaSubscription);
  }
}
