import { ChangeDetectionStrategy, Component, Injector, Input, OnDestroy, OnInit, effect, inject, runInInjectionContext, signal } from '@angular/core';
import { AbstractControl, ReactiveFormsModule, ValidatorFn, Validators, FormControl, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';

import {
  AppInputDirective,
  CustomCheckboxComponent,
  CustomFormFieldComponent,
  FocusDirective,
  UnlimitedInputComponent,
} from '@stratosui/core';
import { QuotaDataService } from '../../../services/endpoint-data/quota-data.service';
import { StOrgQuota } from '../../../services/endpoint-data/stratos-types';
import { cfOsDebugLog } from '../../../shared/data-services/cf-org-space-debug';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../cf.helpers';
import { OrgQuotaFormValues, orgQuotaToFormValues } from './quota-form-mapping';

// Re-export for legacy step-component imports.
export type QuotaFormValues = OrgQuotaFormValues;

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
  // Signal that reflects formGroup.valid for OnPush-friendly change detection.
  private validSignal = signal(false);

  private formStatusSub?: Subscription;
  cfGuid: string;
  allQuotas: string[] = [];
  formGroup!: FormGroup<{
    name: FormControl<string>;
    totalServices: FormControl<number | string>;
    totalRoutes: FormControl<number | string>;
    memoryLimit: FormControl<number | string>;
    instanceMemoryLimit: FormControl<number | string>;
    nonBasicServicesAllowed: FormControl<boolean>;
    totalReservedRoutePorts: FormControl<number | string>;
    appInstanceLimit: FormControl<number | string>;
    totalServiceKeys: FormControl<number | string>;
    totalPrivateDomains: FormControl<number | string>;
    appTasksLimit: FormControl<number | string>;
  }>;

  @Input() quota: StOrgQuota | null = null;

  private quotaData = inject(QuotaDataService);
  private injector = inject(Injector);

  constructor() {
    const activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);
    this.cfGuid = activeRouteCfOrgSpace.cfGuid;
    cfOsDebugLog('quotaForm:construct', {
      cfGuid: this.cfGuid,
      hasQuota: !!this.quota,
    });
  }

  ngOnInit() {
    cfOsDebugLog('quotaForm:init', {
      cfGuid: this.cfGuid,
      hasQuota: !!this.quota,
      quotaName: this.quota?.name ?? null,
    });
    this.setupForm();
    this.fetchQuotasDefinitions();
    this.validSignal.set(this.formGroup.valid);
    this.formStatusSub = this.formGroup.statusChanges.subscribe(
      () => this.validSignal.set(this.formGroup.valid)
    );
  }

  setupForm() {
    const initial: OrgQuotaFormValues | null = this.quota ? orgQuotaToFormValues(this.quota) : null;

    this.formGroup = new FormGroup({
      name: new FormControl(initial?.name ?? '', { nonNullable: true, validators: [Validators.required, this.nameTakenValidator()] }),
      totalServices: new FormControl<number | string>(initial?.totalServices ?? '', { nonNullable: true }),
      totalRoutes: new FormControl<number | string>(initial?.totalRoutes ?? '', { nonNullable: true }),
      memoryLimit: new FormControl<number | string>(initial?.memoryLimit ?? '', { nonNullable: true }),
      instanceMemoryLimit: new FormControl<number | string>(initial?.instanceMemoryLimit ?? '', { nonNullable: true }),
      nonBasicServicesAllowed: new FormControl(initial?.nonBasicServicesAllowed ?? false, { nonNullable: true }),
      totalReservedRoutePorts: new FormControl<number | string>(initial?.totalReservedRoutePorts ?? '', { nonNullable: true }),
      appInstanceLimit: new FormControl<number | string>(initial?.appInstanceLimit ?? '', { nonNullable: true }),
      totalServiceKeys: new FormControl<number | string>(initial?.totalServiceKeys ?? '', { nonNullable: true }),
      totalPrivateDomains: new FormControl<number | string>(initial?.totalPrivateDomains ?? '', { nonNullable: true }),
      appTasksLimit: new FormControl<number | string>(initial?.appTasksLimit ?? '', { nonNullable: true }),
    });
  }

  fetchQuotasDefinitions() {
    // SignalSource pulls the foundation's org quotas in a single
    // /pp/v1/cf/organization_quotas/:cnsi call; we mirror the names into
    // `allQuotas` for the name-taken validator to consult on each
    // statusChange.
    const source = this.quotaData.orgQuotas(this.cfGuid);
    runInInjectionContext(this.injector, () => {
      effect(() => {
        const list = source.value();
        if (list && list.length) {
          this.allQuotas = list.map(q => q.name);
          // Re-trigger validation if the form already exists.
          this.formGroup?.controls.name.updateValueAndValidity({ emitEvent: false });
        }
      });
    });
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

  valid = () => this.validSignal();

  ngOnDestroy() {
    this.formStatusSub?.unsubscribe();
  }
}
