import { Component, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { filter, map, pairwise, tap } from 'rxjs/operators';

import { CF_ENDPOINT_TYPE } from '../../../../../../cloud-foundry/src/cf-types';
import {
  GetSpaceQuotaDefinition,
  UpdateSpaceQuotaDefinition,
} from '../../../../../../cloud-foundry/src/actions/quota-definitions.actions';
import {
  SpaceQuotaDefinitionActionBuilders,
} from '../../../../../../cloud-foundry/src/entity-action-builders/space-quota.action-builders';
import { AppState } from '../../../../../../store/src/app-state';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { IQuotaDefinition } from '../../../../core/cf-api.types';
import { entityCatalog } from '../../../../../../store/src/entity-catalog/entity-catalog.service';
import { IEntityMetadata } from '../../../../../../store/src/entity-catalog/entity-catalog.types';
import { EntityServiceFactory } from '../../../../../../store/src/entity-service-factory.service';
import { safeUnsubscribe } from '../../../../core/utils.service';
import { StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import { SpaceQuotaDefinitionFormComponent } from '../../space-quota-definition-form/space-quota-definition-form.component';
import { spaceQuotaEntityType } from '../../../../../../cloud-foundry/src/cf-entity-types';


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
