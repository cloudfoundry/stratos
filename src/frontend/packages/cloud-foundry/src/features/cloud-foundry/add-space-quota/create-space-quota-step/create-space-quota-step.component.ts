import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { filter, map, pairwise } from 'rxjs/operators';

import { cfEntityCatalog } from '../../../../../../cloud-foundry/src/cf-entity-catalog';
import { ActiveRouteCfOrgSpace } from '../../../../../../cloud-foundry/src/features/cloud-foundry/cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../../../../../../cloud-foundry/src/features/cloud-foundry/cf.helpers';
import { StepOnNextFunction } from '../../../../../../core/src/shared/components/stepper/step/step.component';
import { RequestInfoState } from '../../../../../../store/src/reducers/api-request-reducer/types';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { IQuotaDefinition } from '../../../../cf-api.types';
import { SpaceQuotaDefinitionFormComponent } from '../../space-quota-definition-form/space-quota-definition-form.component';


@Component({
  selector: 'app-create-space-quota-step',
  templateUrl: './create-space-quota-step.component.html',
  styleUrls: ['./create-space-quota-step.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider
  ]
})
export class CreateSpaceQuotaStepComponent {

  quotasSubscription: Subscription;
  cfGuid: string;
  orgGuid: string;
  spaceQuotaDefinitions$: Observable<APIResource<IQuotaDefinition>[]>;

  @ViewChild('form', { static: true })
  form: SpaceQuotaDefinitionFormComponent;

  constructor(
    activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private activatedRoute: ActivatedRoute,
  ) {
    this.cfGuid = activeRouteCfOrgSpace.cfGuid;
    this.orgGuid = this.activatedRoute.snapshot.params.orgId;
  }

  validate = () => !!this.form && this.form.valid();

  submit: StepOnNextFunction = () => {
    const formValues = this.form.formGroup.value;

    return cfEntityCatalog.spaceQuota.api.create<RequestInfoState>(formValues.name, this.cfGuid, {
      orgGuid: this.orgGuid,
      createQuota: formValues
    }).pipe(
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
