import { ChangeDetectionStrategy, Component, Injector, Input, OnDestroy, OnInit, effect, inject, runInInjectionContext, signal } from '@angular/core';
import { AbstractControl, ReactiveFormsModule, ValidatorFn, Validators, FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import { AppInputDirective, CustomFormFieldComponent, CustomCheckboxComponent, FocusDirective, UnlimitedInputComponent } from '@stratosui/core';
import { QuotaDataService } from '../../../services/endpoint-data/quota-data.service';
import { StSpaceQuota } from '../../../services/endpoint-data/stratos-types';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../cf.helpers';
import { SpaceQuotaFormValues, spaceQuotaToFormValues } from '../quota-definition-form/quota-form-mapping';

// Re-export for legacy step-component imports.
export type { SpaceQuotaFormValues };

@Component({
  selector: 'app-space-quota-definition-form',
  templateUrl: './space-quota-definition-form.component.html',
  providers: [
    getActiveRouteCfOrgSpaceProvider
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    AppInputDirective,
    CustomCheckboxComponent,
    CustomFormFieldComponent,
    FocusDirective,
    UnlimitedInputComponent
]
})
export class SpaceQuotaDefinitionFormComponent implements OnInit, OnDestroy {
  private activatedRoute = inject(ActivatedRoute);
  private quotaData = inject(QuotaDataService);
  private injector = inject(Injector);

  private validSignal = signal(false);

  private formStatusSub?: Subscription;
  cfGuid: string;
  orgGuid: string;
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
    appTasksLimit: FormControl<number | string>;
  }>;

  @Input() quota: StSpaceQuota | null = null;

  constructor() {
    const activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);
    this.cfGuid = activeRouteCfOrgSpace.cfGuid;
    this.orgGuid = this.activatedRoute.snapshot.params.orgId;
  }

  ngOnInit() {
    this.setupForm();
    this.fetchQuotasDefinitions();
    this.validSignal.set(this.formGroup.valid);
    this.formStatusSub = this.formGroup.statusChanges.subscribe(
      () => this.validSignal.set(this.formGroup.valid)
    );
  }

  setupForm() {
    const initial: SpaceQuotaFormValues | null = this.quota ? spaceQuotaToFormValues(this.quota) : null;

    this.formGroup = new FormGroup({
      name: new FormControl(initial?.name ?? '', {
        validators: [Validators.required, this.nameTakenValidator()],
        nonNullable: true
      }),
      totalServices: new FormControl<number | string>(initial?.totalServices ?? '', { nonNullable: true }),
      totalRoutes: new FormControl<number | string>(initial?.totalRoutes ?? '', { nonNullable: true }),
      memoryLimit: new FormControl<number | string>(initial?.memoryLimit ?? '', { nonNullable: true }),
      instanceMemoryLimit: new FormControl<number | string>(initial?.instanceMemoryLimit ?? '', { nonNullable: true }),
      nonBasicServicesAllowed: new FormControl(initial?.nonBasicServicesAllowed ?? false, { nonNullable: true }),
      totalReservedRoutePorts: new FormControl<number | string>(initial?.totalReservedRoutePorts ?? '', { nonNullable: true }),
      appInstanceLimit: new FormControl<number | string>(initial?.appInstanceLimit ?? '', { nonNullable: true }),
      totalServiceKeys: new FormControl<number | string>(initial?.totalServiceKeys ?? '', { nonNullable: true }),
      appTasksLimit: new FormControl<number | string>(initial?.appTasksLimit ?? '', { nonNullable: true }),
    });
  }

  fetchQuotasDefinitions() {
    const source = this.quotaData.spaceQuotasInOrg(this.cfGuid, this.orgGuid);
    runInInjectionContext(this.injector, () => {
      effect(() => {
        const list = source.value();
        if (list && list.length) {
          this.allQuotas = list.map(q => q.name);
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
