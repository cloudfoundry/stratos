import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';

import { GetOrganizationSpaceQuotaDefinitions } from '../../../../../store/src/actions/quota-definitions.actions';
import { AppState } from '../../../../../store/src/app-state';
import { endpointSchemaKey, entityFactory, spaceQuotaSchemaKey } from '../../../../../store/src/helpers/entity-factory';
import { createEntityRelationPaginationKey } from '../../../../../store/src/helpers/entity-relations/entity-relations.types';
import { getPaginationObservables } from '../../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource } from '../../../../../store/src/types/api.types';
import { IQuotaDefinition } from '../../../core/cf-api.types';
import { safeUnsubscribe } from '../../../core/utils.service';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';


@Component({
  selector: 'app-space-quota-definition-form',
  templateUrl: './space-quota-definition-form.component.html',
  styleUrls: ['./space-quota-definition-form.component.scss']
})
export class SpaceQuotaDefinitionFormComponent implements OnInit, OnDestroy {
  quotasSubscription: Subscription;
  cfGuid: string;
  orgGuid: string;
  allQuotas: string[];
  spaceQuotaDefinitions$: Observable<APIResource<IQuotaDefinition>[]>;
  formGroup: FormGroup;

  @Input() quota: IQuotaDefinition;

  constructor(
    private store: Store<AppState>,
    private activatedRoute: ActivatedRoute,
    private paginationMonitorFactory: PaginationMonitorFactory,
  ) {
    this.cfGuid = this.activatedRoute.snapshot.params.endpointId;
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

    // this.formGroup = new FormGroup({
    //   name: new FormControl('', [Validators.required as any, this.nameTakenValidator()]),
    //   totalServices: new FormControl(),
    //   totalRoutes: new FormControl(),
    //   memoryLimit: new FormControl(),
    //   instanceMemoryLimit: new FormControl(),
    //   nonBasicServicesAllowed: new FormControl(false),
    //   totalReservedRoutePorts: new FormControl(),
    //   appInstanceLimit: new FormControl(),
    // });
  }

  fetchQuotasDefinitions() {
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
