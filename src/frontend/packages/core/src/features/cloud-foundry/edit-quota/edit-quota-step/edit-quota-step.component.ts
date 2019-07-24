import { Component, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { filter, first, map, tap } from 'rxjs/operators';

import { GetQuotaDefinition, UpdateQuotaDefinition } from '../../../../../../store/src/actions/quota-definitions.actions';
import { AppState } from '../../../../../../store/src/app-state';
import { entityFactory, quotaDefinitionSchemaKey } from '../../../../../../store/src/helpers/entity-factory';
import { selectRequestInfo } from '../../../../../../store/src/selectors/api.selectors';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { IQuotaDefinition } from '../../../../core/cf-api.types';
import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import { safeUnsubscribe } from '../../../../core/utils.service';
import { StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import { QuotaDefinitionFormComponent } from '../../quota-definition-form/quota-definition-form.component';


@Component({
  selector: 'app-edit-quota-step',
  templateUrl: './edit-quota-step.component.html',
  styleUrls: ['./edit-quota-step.component.scss']
})
export class EditQuotaStepComponent implements OnDestroy {

  cfGuid: string;
  quotaGuid: string;
  quotaDefinition$: Observable<APIResource<IQuotaDefinition>>;
  quotaSubscription: Subscription;
  quota: IQuotaDefinition;

  @ViewChild('form')
  form: QuotaDefinitionFormComponent;

  constructor(
    private store: Store<AppState>,
    private activatedRoute: ActivatedRoute,
    private entityServiceFactory: EntityServiceFactory
  ) {
    this.cfGuid = this.activatedRoute.snapshot.params.endpointId;
    this.quotaGuid = this.activatedRoute.snapshot.params.quotaId;

    this.fetchQuotaDefinition();
  }

  fetchQuotaDefinition() {
    this.quotaDefinition$ = this.entityServiceFactory.create<APIResource<IQuotaDefinition>>(
      quotaDefinitionSchemaKey,
      entityFactory(quotaDefinitionSchemaKey),
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

    this.store.dispatch(new UpdateQuotaDefinition(this.quotaGuid, this.cfGuid, {
      name: formValues.name,
      total_services: formValues.totalServices,
      total_routes: formValues.totalRoutes,
      memory_limit: formValues.memoryLimit,
      app_task_limit: formValues.appTasksLimit,
      total_private_domains: formValues.totalPrivateDomains,
      total_service_keys: formValues.totalServiceKeys,
      instance_memory_limit: formValues.instanceMemoryLimit,
      non_basic_services_allowed: formValues.nonBasicServicesAllowed,
      total_reserved_route_ports: formValues.totalReservedRoutePorts,
      app_instance_limit: formValues.appInstanceLimit
    }));

    return this.store.select(selectRequestInfo(quotaDefinitionSchemaKey, this.quotaGuid)).pipe(
      filter(o => !!o && !o.updating[UpdateQuotaDefinition.UpdateExistingQuota].busy),
      map(o => o.updating[UpdateQuotaDefinition.UpdateExistingQuota]),
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
