import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';

import { CF_ENDPOINT_TYPE } from '../../../../../cloud-foundry/src/cf-types';
import { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import { cfEntityFactory } from '../../../../../cloud-foundry/src/cf-entity-factory';
import { quotaDefinitionEntityType } from '../../../../../cloud-foundry/src/cf-entity-types';
import { createEntityRelationPaginationKey } from '../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { endpointSchemaKey } from '../../../../../store/src/helpers/entity-factory';
import { getPaginationObservables } from '../../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource } from '../../../../../store/src/types/api.types';
import { IQuotaDefinition } from '../../../core/cf-api.types';
import { entityCatalog } from '../../../../../store/src/entity-catalog/entity-catalog.service';
import { safeUnsubscribe } from '../../../core/utils.service';
import { PaginationMonitorFactory } from '../../../../../store/src/monitors/pagination-monitor.factory';
import { IEntityMetadata } from '../../../../../store/src/entity-catalog/entity-catalog.types';
import { QuotaDefinitionActionBuilder } from '../../../../../cloud-foundry/src/entity-action-builders/quota-definition.action-builders';

export interface QuotaFormValues {
  name: string;
  totalServices: number;
  totalRoutes: number;
  memoryLimit: number;
  appTasksLimit: number;
  totalPrivateDomains: number;
  totalServiceKeys: number;
  instanceMemoryLimit: number;
  nonBasicServicesAllowed: boolean;
  totalReservedRoutePorts: number;
  appInstanceLimit: number;
}

@Component({
  selector: 'app-quota-definition-form',
  templateUrl: './quota-definition-form.component.html',
  styleUrls: ['./quota-definition-form.component.scss']
})
export class QuotaDefinitionFormComponent implements OnInit, OnDestroy {
  quotasSubscription: Subscription;
  cfGuid: string;
  allQuotas: string[];
  quotaDefinitions$: Observable<APIResource<IQuotaDefinition>[]>;
  formGroup: FormGroup;

  @Input() quota: IQuotaDefinition;

  constructor(
    private store: Store<CFAppState>,
    private activatedRoute: ActivatedRoute,
    private paginationMonitorFactory: PaginationMonitorFactory,
  ) {
    this.cfGuid = this.activatedRoute.snapshot.params.endpointId;
  }

  ngOnInit() {
    this.setupForm();
    this.fetchQuotasDefinitions();
  }

  setupForm() {
    const quota: any = this.quota || {};

    this.formGroup = new FormGroup({
      name: new FormControl(quota.name || '', [Validators.required, this.nameTakenValidator()]),
      totalServices: new FormControl(quota.total_services),
      totalRoutes: new FormControl(quota.total_routes),
      memoryLimit: new FormControl(quota.memory_limit),
      instanceMemoryLimit: new FormControl(quota.instance_memory_limit),
      nonBasicServicesAllowed: new FormControl(quota.non_basic_services_allowed || false),
      totalReservedRoutePorts: new FormControl(quota.total_reserved_route_ports),
      appInstanceLimit: new FormControl(quota.app_instance_limit),
      totalServiceKeys: new FormControl(quota.total_service_keys),
      totalPrivateDomains: new FormControl(quota.total_private_domains),
      appTasksLimit: new FormControl(quota.app_task_limit),
    });
  }

  fetchQuotasDefinitions() {
    const quotaPaginationKey = createEntityRelationPaginationKey(endpointSchemaKey, this.cfGuid);
    const quotaDefinitionEntity =
      entityCatalog.getEntity<IEntityMetadata, any, QuotaDefinitionActionBuilder>(CF_ENDPOINT_TYPE, quotaDefinitionEntityType);
    const actionBuilder = quotaDefinitionEntity.actionOrchestrator.getActionBuilder('getMultiple');
    const getQuotaDefinitionsAction = actionBuilder(quotaPaginationKey, this.cfGuid, {});
    this.quotaDefinitions$ = getPaginationObservables<APIResource>(
      {
        store: this.store,
        action: getQuotaDefinitionsAction,
        paginationMonitor: this.paginationMonitorFactory.create(
          quotaPaginationKey,
          cfEntityFactory(quotaDefinitionEntityType)
        )
      },
      true
    ).entities$.pipe(
      filter(o => !!o),
      map(o => o.map(org => org.entity.name)),
      tap((o) => this.allQuotas = o)
    );

    this.quotasSubscription = this.quotaDefinitions$.subscribe();
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
    if (this.quota && value === this.quota.name) {
      return true;
    }

    if (this.allQuotas) {
      return this.allQuotas.indexOf(value || this.formGroup.value.name) === -1;
    }

    return true;
  }

  valid = () => !!this.formGroup && this.formGroup.valid;

  ngOnDestroy() {
    safeUnsubscribe(this.quotasSubscription);
  }
}
