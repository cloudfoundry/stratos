import { Component, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { AppState } from '../../../../../../store/src/app-state';
import { selectRequestInfo } from '../../../../../../store/src/selectors/api.selectors';
import { StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import { QuotaDefinitionFormComponent } from '../../quota-definition-form/quota-definition-form.component';
import { quotaDefinitionEntityType } from '../../../../../../cloud-foundry/src/cf-entity-factory';
import { CreateQuotaDefinition } from '../../../../../../cloud-foundry/src/actions/quota-definitions.actions';
import { entityCatalogue } from '../../../../core/entity-catalogue/entity-catalogue.service';
import { CF_ENDPOINT_TYPE } from '../../../../../../cloud-foundry/cf-types';


@Component({
  selector: 'app-create-quota-step',
  templateUrl: './create-quota-step.component.html',
  styleUrls: ['./create-quota-step.component.scss']
})
export class CreateQuotaStepComponent {

  quotasSubscription: Subscription;
  cfGuid: string;
  quotaForm: FormGroup;

  @ViewChild('form')
  form: QuotaDefinitionFormComponent;

  constructor(
    private store: Store<AppState>,
    private activatedRoute: ActivatedRoute,
  ) {
    this.cfGuid = this.activatedRoute.snapshot.params.endpointId;
  }

  validate = () => !!this.form && this.form.valid();

  submit: StepOnNextFunction = () => {
    const formValues = this.form.formGroup.value;
    this.store.dispatch(new CreateQuotaDefinition(this.cfGuid, formValues));

    return this.store.select(
      selectRequestInfo(
        entityCatalogue.getEntityKey(CF_ENDPOINT_TYPE, quotaDefinitionEntityType),
        formValues.name
      )
    ).pipe(
      filter(requestInfo => !!requestInfo && !requestInfo.creating),
      map(requestInfo => ({
        success: !requestInfo.error,
        redirect: !requestInfo.error,
        message: requestInfo.error ? `Failed to create quota: ${requestInfo.message}` : ''
      }))
    );
  }
}
