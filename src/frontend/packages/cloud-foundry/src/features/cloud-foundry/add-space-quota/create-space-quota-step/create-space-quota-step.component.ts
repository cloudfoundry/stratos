import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { filter, map, pairwise } from 'rxjs/operators';

import { StepOnNextFunction } from '../../../../../../core/src/shared/components/stepper/step/step.component';
import { AppState } from '../../../../../../store/src/app-state';
import { entityCatalog } from '../../../../../../store/src/entity-catalog/entity-catalog.service';
import { IEntityMetadata } from '../../../../../../store/src/entity-catalog/entity-catalog.types';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { IQuotaDefinition } from '../../../../cf-api.types';
import { spaceQuotaEntityType } from '../../../../cf-entity-types';
import { CF_ENDPOINT_TYPE } from '../../../../cf-types';
import { SpaceQuotaDefinitionActionBuilders } from '../../../../entity-action-builders/space-quota.action-builders';
import { SpaceQuotaDefinitionFormComponent } from '../../space-quota-definition-form/space-quota-definition-form.component';


@Component({
  selector: 'app-create-space-quota-step',
  templateUrl: './create-space-quota-step.component.html',
  styleUrls: ['./create-space-quota-step.component.scss']
})
export class CreateSpaceQuotaStepComponent {

  quotasSubscription: Subscription;
  cfGuid: string;
  orgGuid: string;
  spaceQuotaDefinitions$: Observable<APIResource<IQuotaDefinition>[]>;

  @ViewChild('form', { static: true })
  form: SpaceQuotaDefinitionFormComponent;

  constructor(
    private store: Store<AppState>,
    private activatedRoute: ActivatedRoute,
  ) {
    this.cfGuid = this.activatedRoute.snapshot.params.endpointId;
    this.orgGuid = this.activatedRoute.snapshot.params.orgId;
  }

  validate = () => !!this.form && this.form.valid();

  submit: StepOnNextFunction = () => {
    const formValues = this.form.formGroup.value;

    const entityConfig =
      entityCatalog.getEntity<IEntityMetadata, any, SpaceQuotaDefinitionActionBuilders>(CF_ENDPOINT_TYPE, spaceQuotaEntityType);
    entityConfig.actionDispatchManager.dispatchCreate(formValues.name, this.cfGuid, {
      orgGuid: this.orgGuid,
      createQuota: formValues
    });

    return entityConfig.getEntityMonitor(this.store, formValues.name).entityRequest$.pipe(
      pairwise(),
      filter(([oldV, newV]) => oldV.creating && !newV.creating),
      map(([, newV]) => newV),
      map(requestInfo => ({
        success: !requestInfo.error,
        redirect: !requestInfo.error,
        message: requestInfo.error ? `Failed to create space quota: ${requestInfo.message}` : ''
      }))
    );
  }
}
