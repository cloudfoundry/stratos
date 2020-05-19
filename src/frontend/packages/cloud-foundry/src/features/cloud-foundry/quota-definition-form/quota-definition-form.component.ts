import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';

import { cfEntityCatalog } from '../../../../../cloud-foundry/src/cf-entity-catalog';
import { createEntityRelationPaginationKey } from '../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { ActiveRouteCfOrgSpace } from '../../../../../cloud-foundry/src/features/cloud-foundry/cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../../../../../cloud-foundry/src/features/cloud-foundry/cf.helpers';
import { safeUnsubscribe } from '../../../../../core/src/core/utils.service';
import { endpointSchemaKey } from '../../../../../store/src/helpers/entity-factory';
import { IQuotaDefinition } from '../../../cf-api.types';

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
  styleUrls: ['./quota-definition-form.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider
  ]
})
export class QuotaDefinitionFormComponent implements OnInit, OnDestroy {
  quotasSubscription: Subscription;
  cfGuid: string;
  allQuotas: string[];
  formGroup: FormGroup;

  @Input() quota: IQuotaDefinition;

  constructor(
    activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
  ) {
    this.cfGuid = activeRouteCfOrgSpace.cfGuid;
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
    const quotaDefinitions$ = cfEntityCatalog.quotaDefinition.store.getPaginationService(quotaPaginationKey, this.cfGuid, {})
      .entities$.pipe(
        filter(o => !!o),
        map(o => o.map(org => org.entity.name)),
        tap((o: string[]) => this.allQuotas = o)
      );

    this.quotasSubscription = quotaDefinitions$.subscribe();
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
