import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';

import { cfEntityCatalog } from '../../../../../cloud-foundry/src/cf-entity-catalog';
import { createEntityRelationPaginationKey } from '../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { ActiveRouteCfOrgSpace } from '../../../../../cloud-foundry/src/features/cloud-foundry/cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../../../../../cloud-foundry/src/features/cloud-foundry/cf.helpers';
import { safeUnsubscribe } from '../../../../../core/src/core/utils.service';
import { endpointSchemaKey } from '../../../../../store/src/helpers/entity-factory';
import { IQuotaDefinition } from '../../../cf-api.types';


@Component({
  selector: 'app-space-quota-definition-form',
  templateUrl: './space-quota-definition-form.component.html',
  styleUrls: ['./space-quota-definition-form.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider
  ]
})
export class SpaceQuotaDefinitionFormComponent implements OnInit, OnDestroy {
  quotasSubscription: Subscription;
  cfGuid: string;
  orgGuid: string;
  allQuotas: string[];
  spaceQuotaDefinitions$: Observable<string[]>;
  formGroup: FormGroup;

  @Input() quota: IQuotaDefinition;

  constructor(
    activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private activatedRoute: ActivatedRoute,
  ) {
    this.cfGuid = activeRouteCfOrgSpace.cfGuid;
    this.orgGuid = this.activatedRoute.snapshot.params.orgId;
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
      appTasksLimit: new FormControl(quota.app_task_limit),
    });
  }

  fetchQuotasDefinitions() {
    this.spaceQuotaDefinitions$ = cfEntityCatalog.spaceQuota.store.getAllInOrganization.getPaginationService(
      this.orgGuid,
      this.cfGuid,
      createEntityRelationPaginationKey(endpointSchemaKey, this.cfGuid)
    ).entities$
      .pipe(
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
