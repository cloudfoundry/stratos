import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { filter, map, pairwise } from 'rxjs/operators';

import { CF_ENDPOINT_TYPE } from '../../../../../../cloud-foundry/cf-types';
import { spaceQuotaEntityType } from '../../../../../../cloud-foundry/src/cf-entity-factory';
import {
  SpaceQuotaDefinitionActionBuilders,
} from '../../../../../../cloud-foundry/src/entity-action-builders/space-quota.action-builders';
import { AppState } from '../../../../../../store/src/app-state';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { IQuotaDefinition } from '../../../../core/cf-api.types';
import { entityCatalogue } from '../../../../core/entity-catalogue/entity-catalogue.service';
import { IEntityMetadata } from '../../../../core/entity-catalogue/entity-catalogue.types';
import { StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
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

  @ViewChild('form')
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
      entityCatalogue.getEntity<IEntityMetadata, any, SpaceQuotaDefinitionActionBuilders>(CF_ENDPOINT_TYPE, spaceQuotaEntityType);
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
