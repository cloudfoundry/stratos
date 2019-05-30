import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';

import {
  CreateSpaceQuotaDefinition,
  GetOrganizationSpaceQuotaDefinitions,
} from '../../../../../../store/src/actions/quota-definitions.actions';
import { AppState } from '../../../../../../store/src/app-state';
import { endpointSchemaKey, entityFactory, spaceQuotaSchemaKey } from '../../../../../../store/src/helpers/entity-factory';
import {
  createEntityRelationPaginationKey,
} from '../../../../../../store/src/helpers/entity-relations/entity-relations.types';
import { getPaginationObservables } from '../../../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { selectRequestInfo } from '../../../../../../store/src/selectors/api.selectors';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { IQuotaDefinition } from '../../../../core/cf-api.types';
import { safeUnsubscribe } from '../../../../core/utils.service';
import { StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import { PaginationMonitorFactory } from '../../../../shared/monitors/pagination-monitor.factory';


@Component({
  selector: 'app-create-space-quota-step',
  templateUrl: './create-space-quota-step.component.html',
  styleUrls: ['./create-space-quota-step.component.scss']
})
export class CreateSpaceQuotaStepComponent implements OnInit, OnDestroy {

  quotasSubscription: Subscription;
  cfGuid: string;
  orgGuid: string;
  allQuotas: string[];
  spaceQuotaDefinitions$: Observable<APIResource<IQuotaDefinition>[]>;
  quotaForm: FormGroup;

  constructor(
    private store: Store<AppState>,
    private activatedRoute: ActivatedRoute,
    private paginationMonitorFactory: PaginationMonitorFactory,
  ) {
    this.cfGuid = this.activatedRoute.snapshot.params.endpointId;
    this.orgGuid = this.activatedRoute.snapshot.params.orgId;
  }

  ngOnInit() {
    this.quotaForm = new FormGroup({
      name: new FormControl('', [Validators.required as any, this.nameTakenValidator()]),
      totalServices: new FormControl(),
      totalRoutes: new FormControl(),
      memoryLimit: new FormControl(),
      instanceMemoryLimit: new FormControl(),
      nonBasicServicesAllowed: new FormControl(false),
      totalReservedRoutePorts: new FormControl(),
      appInstanceLimit: new FormControl(),
    });

    const spaceQuotaPaginationKey = createEntityRelationPaginationKey(endpointSchemaKey, this.cfGuid);
    this.spaceQuotaDefinitions$ = getPaginationObservables<APIResource>(
      {
        store: this.store,
        action: new GetOrganizationSpaceQuotaDefinitions(spaceQuotaPaginationKey, this.orgGuid, this.cfGuid),
        paginationMonitor: this.paginationMonitorFactory.create(
          spaceQuotaPaginationKey,
          entityFactory(spaceQuotaSchemaKey)
        )
      },
      true
    ).entities$.pipe(
      filter(o => !!o),
      map(o => o.map(org => org.entity.name)),
      tap((o) => this.allQuotas = o)
    );

    this.quotasSubscription = this.spaceQuotaDefinitions$.subscribe();
  }

  nameTakenValidator = (): ValidatorFn => {
    return (formField: AbstractControl): { [key: string]: any } => {
      if (!this.validateNameTaken(formField.value)) {
        return { nameTaken: { value: formField.value } };
      }

      return null;
    };
  }

  validateNameTaken = (value: string = null) => {
    if (this.allQuotas) {
      return this.allQuotas.indexOf(value || this.quotaForm.value.name) === -1;
    }

    return true;
  }

  validate = () => !!this.quotaForm && this.quotaForm.valid;

  submit: StepOnNextFunction = () => {
    const formValues = this.quotaForm.value;

    this.store.dispatch(new CreateSpaceQuotaDefinition(this.cfGuid, {
      name: formValues.name,
      organization_guid: this.orgGuid,
      total_services: formValues.totalServices,
      total_routes: formValues.totalRoutes,
      memory_limit: formValues.memoryLimit,
      instance_memory_limit: formValues.instanceMemoryLimit,
      non_basic_services_allowed: formValues.nonBasicServicesAllowed,
      total_reserved_route_ports: formValues.totalReservedRoutePorts,
      app_instance_limit: formValues.appInstanceLimit
    }));

    return this.store.select(selectRequestInfo(spaceQuotaSchemaKey, this.quotaForm.value.name)).pipe(
      filter(requestInfo => !!requestInfo && !requestInfo.creating),
      map(requestInfo => ({
        success: !requestInfo.error,
        redirect: !requestInfo.error,
        message: requestInfo.error ? `Failed to create space quota: ${requestInfo.message}` : ''
      }))
    );
  }

  ngOnDestroy() {
    safeUnsubscribe(this.quotasSubscription);
  }
}
