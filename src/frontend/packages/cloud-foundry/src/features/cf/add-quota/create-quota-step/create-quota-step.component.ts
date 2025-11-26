import { Component, ViewChild , ChangeDetectionStrategy } from '@angular/core';
import type { FormGroup } from '@angular/forms';
import type { Subscription } from 'rxjs';
import { filter, map, pairwise } from 'rxjs/operators';

import type { StepOnNextFunction } from '@stratosui/core';
import type { RequestInfoState } from '@stratosui/store';
import { cfEntityCatalog } from '../../../../cf-entity-catalog';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../../cf.helpers';
import { QuotaDefinitionFormComponent } from '../../quota-definition-form/quota-definition-form.component';


@Component({
  selector: 'app-create-quota-step',
  templateUrl: './create-quota-step.component.html',
  styleUrls: ['./create-quota-step.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    QuotaDefinitionFormComponent
  ]
})
export class CreateQuotaStepComponent {

  quotasSubscription!: Subscription;
  cfGuid: string;
  quotaForm!: FormGroup;

  @ViewChild('form', { static: true })
  form!: QuotaDefinitionFormComponent;

  constructor(
    activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
  ) {
    this.cfGuid = activeRouteCfOrgSpace.cfGuid;
  }

  validate = () => !!this.form && this.form.valid();

  submit: StepOnNextFunction = () => {
    const formValues = this.form.formGroup.getRawValue();
    return cfEntityCatalog.quotaDefinition.api.create<RequestInfoState>(formValues.name, this.cfGuid, formValues).pipe(
      pairwise(),
      filter(([oldV, newV]) => oldV.creating && !newV.creating),
      map(([, newV]) => newV),
      map(requestInfo => ({
        success: !requestInfo.error,
        redirect: !requestInfo.error,
        message: requestInfo.error ? `Failed to create quota: ${requestInfo.message}` : ''
      }))
    );
  }
}
