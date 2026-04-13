
import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, ReactiveFormsModule, ValidatorFn, Validators, FormControl, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';

import {
  AppInputDirective,
  CustomCheckboxComponent,
  CustomFormFieldComponent,
  FocusDirective,
  UnlimitedInputComponent,
  safeUnsubscribe
} from '@stratosui/core';
import { endpointEntityType } from '@stratosui/store';
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
  providers: [
    getActiveRouteCfOrgSpaceProvider
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    AppInputDirective,
    CustomFormFieldComponent,
    CustomCheckboxComponent,
    FocusDirective,
    UnlimitedInputComponent
]
})
export class QuotaDefinitionFormComponent implements OnInit, OnDestroy {
  /**
   * Signal that reflects formGroup.valid. Reading this in a template
   * binding (via form.valid()) registers the consuming component as a
   * dependent, so Angular auto-marks it dirty when the signal changes,
   * regardless of OnPush / ngTemplateOutlet boundaries.
   */
  private validSignal = signal(false);

  quotasSubscription!: Subscription;
  private formStatusSub?: Subscription;
  cfGuid: string;
  allQuotas!: string[];
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

  @Input() quota!: IQuotaDefinition;

  constructor() {
    const activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);

    this.cfGuid = activeRouteCfOrgSpace.cfGuid;
  }

  ngOnInit() {
    this.setupForm();
    this.fetchQuotasDefinitions();
    // Mirror formGroup.valid into a signal. The template binding
    // [valid]="step1.validate()" calls this.valid(), which reads the
    // signal; any change to the signal causes Angular to mark the
    // consuming component dirty automatically — no need for tick() or
    // manual markForCheck — and it works across ngTemplateOutlet /
    // OnPush boundaries.
    this.validSignal.set(this.formGroup.valid);
    this.formStatusSub = this.formGroup.statusChanges.subscribe(
      () => this.validSignal.set(this.formGroup.valid)
    );
  }

  setupForm() {
    const quota: any = this.quota || {};

    this.formGroup = new FormGroup({
      name: new FormControl(quota.name || '', { nonNullable: true, validators: [Validators.required, this.nameTakenValidator()] }),
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
      return this.allQuotas.indexOf(value ?? this.formGroup.value.name ?? '') === -1;
    }

    return true;
  }

  // Read the signal so the template binding that calls this method
  // registers as a dependent and auto-refreshes when status changes.
  valid = () => this.validSignal();

  ngOnDestroy() {
    safeUnsubscribe(this.quotasSubscription);
    this.formStatusSub?.unsubscribe();
  }
}
