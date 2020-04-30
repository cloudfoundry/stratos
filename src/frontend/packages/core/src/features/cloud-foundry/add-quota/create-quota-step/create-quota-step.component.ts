import { Component, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter, map, pairwise } from 'rxjs/operators';

import { cfEntityCatalog } from '../../../../../../cloud-foundry/src/cf-entity-catalog';
import { RequestInfoState } from '../../../../../../store/src/reducers/api-request-reducer/types';
import { StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import { QuotaDefinitionFormComponent } from '../../quota-definition-form/quota-definition-form.component';


@Component({
  selector: 'app-create-quota-step',
  templateUrl: './create-quota-step.component.html',
  styleUrls: ['./create-quota-step.component.scss']
})
export class CreateQuotaStepComponent {

  quotasSubscription: Subscription;
  cfGuid: string;
  quotaForm: FormGroup;

  @ViewChild('form', { static: true })
  form: QuotaDefinitionFormComponent;

  constructor(
    private activatedRoute: ActivatedRoute,
  ) {
    this.cfGuid = this.activatedRoute.snapshot.params.endpointId;
  }

  validate = () => !!this.form && this.form.valid();

  submit: StepOnNextFunction = () => {
    const formValues = this.form.formGroup.value;
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
