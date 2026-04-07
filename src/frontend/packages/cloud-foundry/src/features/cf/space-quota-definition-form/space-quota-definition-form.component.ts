import { Component, Input, OnDestroy, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { AbstractControl, ReactiveFormsModule, ValidatorFn, Validators, FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';

import { CustomFormFieldComponent, CustomCheckboxComponent, FocusDirective, UnlimitedInputComponent, safeUnsubscribe } from '@stratosui/core';
import { endpointEntityType } from '@stratosui/store';
import { IQuotaDefinition } from '../../../cf-api.types';
import { cfEntityCatalog } from '../../../cf-entity-catalog';
import { createEntityRelationPaginationKey } from '../../../entity-relations/entity-relations.types';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../cf.helpers';

export interface SpaceQuotaFormValues {
  name: string;
  totalServices: number;
  totalRoutes: number;
  memoryLimit: number;
  instanceMemoryLimit: number;
  nonBasicServicesAllowed: boolean;
  totalReservedRoutePorts: number;
  appInstanceLimit: number;
  totalServiceKeys: number;
  totalPrivateDomains: number;
  appTasksLimit: number;
}


@Component({
  selector: 'app-space-quota-definition-form',
  templateUrl: './space-quota-definition-form.component.html',
  styleUrls: ['./space-quota-definition-form.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    CustomCheckboxComponent,
    CustomFormFieldComponent,
    FocusDirective,
    UnlimitedInputComponent
]
})
export class SpaceQuotaDefinitionFormComponent implements OnInit, OnDestroy {
  private activatedRoute = inject(ActivatedRoute);

  quotasSubscription!: Subscription;
  cfGuid: string;
  orgGuid: string;
  allQuotas!: string[];
  spaceQuotaDefinitions$!: Observable<string[]>;
  formGroup!: FormGroup<{
    name: FormControl<string>;
    totalServices: FormControl<number>;
    totalRoutes: FormControl<number>;
    memoryLimit: FormControl<number>;
    instanceMemoryLimit: FormControl<number>;
    nonBasicServicesAllowed: FormControl<boolean>;
    totalReservedRoutePorts: FormControl<number>;
    appInstanceLimit: FormControl<number>;
    totalServiceKeys: FormControl<number>;
    totalPrivateDomains: FormControl<number>;
    appTasksLimit: FormControl<number>;
  }>;

  @Input() quota: IQuotaDefinition;

  constructor() {
    const activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);

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
      name: new FormControl(quota.name || '', {
        validators: [Validators.required, this.nameTakenValidator()],
        nonNullable: true
      }),
      totalServices: new FormControl(quota.total_services, { nonNullable: true }),
      totalRoutes: new FormControl(quota.total_routes, { nonNullable: true }),
      memoryLimit: new FormControl(quota.memory_limit, { nonNullable: true }),
      instanceMemoryLimit: new FormControl(quota.instance_memory_limit, { nonNullable: true }),
      nonBasicServicesAllowed: new FormControl(quota.non_basic_services_allowed || false, { nonNullable: true }),
      totalReservedRoutePorts: new FormControl(quota.total_reserved_route_ports, { nonNullable: true }),
      appInstanceLimit: new FormControl(quota.app_instance_limit, { nonNullable: true }),
      totalServiceKeys: new FormControl(quota.total_service_keys, { nonNullable: true }),
      totalPrivateDomains: new FormControl(quota.total_private_domains, { nonNullable: true }),
      appTasksLimit: new FormControl(quota.app_task_limit, { nonNullable: true }),
    });
  }

  fetchQuotasDefinitions() {
    this.spaceQuotaDefinitions$ = cfEntityCatalog.spaceQuota.store.getAllInOrganization.getPaginationService(
      this.orgGuid,
      this.cfGuid,
      createEntityRelationPaginationKey(endpointEntityType, this.cfGuid)
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
      return this.allQuotas.indexOf(value ?? this.formGroup.value.name ?? '') === -1;
    }

    return true;
  }

  valid = () => !!this.formGroup && this.formGroup.valid;

  ngOnDestroy() {
    safeUnsubscribe(this.quotasSubscription);
  }
}
