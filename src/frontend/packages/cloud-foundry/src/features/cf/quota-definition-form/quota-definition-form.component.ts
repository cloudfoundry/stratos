import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormControl, UntypedFormGroup, ValidatorFn, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';

import { safeUnsubscribe } from '../../../../../core/src/core/utils.service';
import { endpointEntityType } from '../../../../../store/src/helpers/stratos-entity-factory';
import { IQuotaDefinition } from '../../../cf-api.types';
import { cfEntityCatalog } from '../../../cf-entity-catalog';
import { createEntityRelationPaginationKey } from '../../../entity-relations/entity-relations.types';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../cf.helpers';

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
  formGroup: UntypedFormGroup;

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

    this.formGroup = new UntypedFormGroup({
      name: new UntypedFormControl(quota.name || '', [Validators.required, this.nameTakenValidator()]),
      totalServices: new UntypedFormControl(quota.total_services),
      totalRoutes: new UntypedFormControl(quota.total_routes),
      memoryLimit: new UntypedFormControl(quota.memory_limit),
      instanceMemoryLimit: new UntypedFormControl(quota.instance_memory_limit),
      nonBasicServicesAllowed: new UntypedFormControl(quota.non_basic_services_allowed || false),
      totalReservedRoutePorts: new UntypedFormControl(quota.total_reserved_route_ports),
      appInstanceLimit: new UntypedFormControl(quota.app_instance_limit),
      totalServiceKeys: new UntypedFormControl(quota.total_service_keys),
      totalPrivateDomains: new UntypedFormControl(quota.total_private_domains),
      appTasksLimit: new UntypedFormControl(quota.app_task_limit),
    });
  }

  fetchQuotasDefinitions() {
    const quotaPaginationKey = createEntityRelationPaginationKey(endpointEntityType, this.cfGuid);
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
