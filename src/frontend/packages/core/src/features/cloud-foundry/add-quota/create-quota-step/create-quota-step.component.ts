import { Component, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { CreateQuotaDefinition } from '../../../../../../store/src/actions/quota-definitions.actions';
import { AppState } from '../../../../../../store/src/app-state';
import { quotaDefinitionSchemaKey } from '../../../../../../store/src/helpers/entity-factory';
import { selectRequestInfo } from '../../../../../../store/src/selectors/api.selectors';
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
    const UNLIMITED = -1;

    this.store.dispatch(new CreateQuotaDefinition(this.cfGuid, {
      name: formValues.name,
      total_services: formValues.totalServices || UNLIMITED,
      total_routes: formValues.totalRoutes || UNLIMITED,
      memory_limit: formValues.memoryLimit,
      instance_memory_limit: formValues.instanceMemoryLimit,
      app_task_limit: formValues.appTasksLimit,
      total_private_domains: formValues.totalPrivateDomains,
      total_service_keys: formValues.totalServiceKeys,
      non_basic_services_allowed: formValues.nonBasicServicesAllowed,
      total_reserved_route_ports: formValues.totalReservedRoutePorts,
      app_instance_limit: formValues.appInstanceLimit
    }));

    return this.store.select(selectRequestInfo(quotaDefinitionSchemaKey, formValues.name)).pipe(
      filter(requestInfo => !!requestInfo && !requestInfo.creating),
      map(requestInfo => ({
        success: !requestInfo.error,
        redirect: !requestInfo.error,
        message: requestInfo.error ? `Failed to create quota: ${requestInfo.message}` : ''
      }))
    );
  }
}
