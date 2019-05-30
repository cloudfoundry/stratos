import { Component, OnDestroy } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';

import {
  GetQuotaDefinitions,
  GetSpaceQuotaDefinition,
  UpdateSpaceQuotaDefinition,
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
import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import { safeUnsubscribe } from '../../../../core/utils.service';
import { StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import { PaginationMonitorFactory } from '../../../../shared/monitors/pagination-monitor.factory';


@Component({
  selector: 'app-edit-space-quota-step',
  templateUrl: './edit-space-quota-step.component.html',
  styleUrls: ['./edit-space-quota-step.component.scss']
})
export class EditSpaceQuotaStepComponent implements OnDestroy {

  spaceQuotasSubscription: Subscription;
  spaceQuotaSubscription: Subscription;
  cfGuid: string;
  spaceQuotaGuid: string;
  allQuotas: string[];
  spaceQuotaDefinitions$: Observable<APIResource<IQuotaDefinition>[]>;
  spaceQuotaDefinition$: Observable<APIResource<IQuotaDefinition>>;
  quotaForm: FormGroup;
  quota: IQuotaDefinition;

  constructor(
    private store: Store<AppState>,
    private activatedRoute: ActivatedRoute,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private entityServiceFactory: EntityServiceFactory
  ) {
    this.cfGuid = this.activatedRoute.snapshot.params.endpointId;
    this.spaceQuotaGuid = this.activatedRoute.snapshot.params.quotaId;

    this.setupForm();
    this.fetchQuotaDefinition();
    this.fetchQuotasDefinitions();
  }

  setupForm() {
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
  }

  fetchQuotasDefinitions() {
    const spaceQuotaPaginationKey = createEntityRelationPaginationKey(endpointSchemaKey, this.cfGuid);
    this.spaceQuotaDefinitions$ = getPaginationObservables<APIResource>(
      {
        store: this.store,
        action: new GetQuotaDefinitions(spaceQuotaPaginationKey, this.cfGuid),
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

    this.spaceQuotasSubscription = this.spaceQuotaDefinitions$.subscribe();
  }

  fetchQuotaDefinition() {
    this.spaceQuotaDefinition$ = this.entityServiceFactory.create<APIResource<IQuotaDefinition>>(
      spaceQuotaSchemaKey,
      entityFactory(spaceQuotaSchemaKey),
      this.spaceQuotaGuid,
      new GetSpaceQuotaDefinition(this.spaceQuotaGuid, this.cfGuid),
    ).waitForEntity$.pipe(
      map(data => data.entity),
      tap((resource) => {
        const quota = resource.entity;
        this.quota = quota;

        this.quotaForm.patchValue({
          name: quota.name,
          totalServices: quota.total_services,
          totalRoutes: quota.total_routes,
          memoryLimit: quota.memory_limit,
          instanceMemoryLimit: quota.instance_memory_limit,
          nonBasicServicesAllowed: quota.non_basic_services_allowed,
          totalReservedRoutePorts: quota.total_reserved_route_ports,
          appInstanceLimit: quota.app_instance_limit,
        });
      })
    );

    this.spaceQuotaSubscription = this.spaceQuotaDefinition$.subscribe();
  }


  nameTakenValidator = (): ValidatorFn => {
    return (formField: AbstractControl): { [key: string]: any } => {
      if (!this.validateNameTaken(formField.value)) {
        return { nameTaken: { value: formField.value } };
      }

      return null;
    }
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

    this.store.dispatch(new UpdateSpaceQuotaDefinition(this.spaceQuotaGuid, this.cfGuid, {
      name: formValues.name,
      total_services: formValues.totalServices,
      total_routes: formValues.totalRoutes,
      memory_limit: formValues.memoryLimit,
      instance_memory_limit: formValues.instanceMemoryLimit,
      non_basic_services_allowed: formValues.nonBasicServicesAllowed,
      total_reserved_route_ports: formValues.totalReservedRoutePorts,
      app_instance_limit: formValues.appInstanceLimit
    }));

    return this.store.select(selectRequestInfo(spaceQuotaSchemaKey, this.spaceQuotaGuid)).pipe(
      filter(o => !!o && !o.updating[UpdateSpaceQuotaDefinition.UpdateExistingSpaceQuota].busy),
      map(o => o.updating[UpdateSpaceQuotaDefinition.UpdateExistingSpaceQuota]),
      map(requestInfo => ({
        success: !requestInfo.error,
        redirect: !requestInfo.error,
        message: requestInfo.error ? `Failed to update space quota: ${requestInfo.message}` : ''
      }))
    );
  }

  ngOnDestroy() {
    safeUnsubscribe(this.spaceQuotaSubscription, this.spaceQuotasSubscription);
  }
}
