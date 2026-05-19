import { CommonModule } from '@angular/common';
import { AppInputDirective, CustomFormFieldComponent } from '@stratosui/core';
import { Component, Injector, OnDestroy, OnInit, ChangeDetectionStrategy, effect, inject, runInInjectionContext, signal, Input } from '@angular/core';
import { AbstractControl, ReactiveFormsModule, ValidatorFn, Validators, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { CustomSelectComponent, CustomOptionComponent } from '../../../../../../core/src/shared/components/custom-select/custom-select.component';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, Subscription } from 'rxjs';
import { filter, map, pairwise } from 'rxjs/operators';

import { FocusDirective } from '../../../../../../core/src/shared/components/focus.directive';
import { SignalStepHandle, StepOnNextFunction } from '../../../../../../core/src/shared/components/stepper/step/step.component';
import { RequestInfoState } from '../../../../../../store/src/reducers/api-request-reducer/types';
import { cfEntityCatalog } from '../../../../cf-entity-catalog';
import { OrgDataRegistry } from '../../../../services/endpoint-data/org-data.registry';
import { QuotaDataService } from '../../../../services/endpoint-data/quota-data.service';
import { AddEditSpaceStepBase } from '../../add-edit-space-step-base';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';

interface CreateSpaceForm {
  spaceName: FormControl<string>;
  quotaDefinition: FormControl<number | string | null>;
}


@Component({
  selector: 'app-create-space-step',
  templateUrl: './create-space-step.component.html',
  styleUrls: ['./create-space-step.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppInputDirective,
    CustomFormFieldComponent,
    CustomSelectComponent,
    CustomOptionComponent,
    FocusDirective
  ]
})
export class CreateSpaceStepComponent extends AddEditSpaceStepBase implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  /** See QuotaDefinitionFormComponent for rationale. */
  private validSignal = signal(false);
  private formStatusSub?: Subscription;

  /** FWT-957: post-success navigation target supplied by parent. */
  @Input() redirectUrl!: string;

  /**
   * FWT-957: signal-native step handle. Reads validity from validSignal,
   * dispatches space create, and navigates to the parent-supplied
   * redirectUrl on success. Replaces legacy onNext + redirect: true.
   */
  signalHandle: SignalStepHandle = {
    valid: this.validSignal.asReadonly(),
    submit: async () => {
      const id = `${this.orgGuid}-${this.spaceName.value}`;
      const quotaValue = this.quotaDefinition.value;
      const finalState = await firstValueFrom(
        cfEntityCatalog.space.api.create<RequestInfoState>(id, this.cfGuid, {
          createSpace: {
            name: this.spaceName.value,
            organization_guid: this.orgGuid,
            space_quota_definition_guid: quotaValue ? String(quotaValue) : undefined as any
          },
          orgGuid: this.orgGuid
        }).pipe(
          pairwise(),
          filter(([oldS, newS]) => oldS.creating && !newS.creating),
          map(([, newS]) => newS),
        )
      );
      if (finalState.error) {
        throw new Error(`Failed to create space: ${finalState.message}`);
      }
      await this.router.navigateByUrl(this.redirectUrl);
    },
  };

  cfUrl!: string;
  createSpaceForm!: FormGroup<CreateSpaceForm>;
  private injector = inject(Injector);

  get spaceName(): FormControl<string> {
    return this.createSpaceForm ? this.createSpaceForm.get('spaceName') as FormControl<string> : new FormControl('', { nonNullable: true });
  }

  get quotaDefinition(): FormControl<number | string | null> {
    const control = this.createSpaceForm.get('quotaDefinition') as FormControl<number | string | null>;
    const nil: FormControl<null> = new FormControl<null>(null, { nonNullable: false });

    if (this.createSpaceForm) {
      return (control.value === 0) ? nil as any : control;
    } else {
      return nil as any;
    }
  }

  constructor() {
    const activatedRoute = inject(ActivatedRoute);
    const activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);
    const orgRegistry = inject(OrgDataRegistry);
    const quotaData = inject(QuotaDataService);

    super(activatedRoute, activeRouteCfOrgSpace, orgRegistry, quotaData);
  }

  ngOnInit() {
    this.createSpaceForm = this.fb.group<CreateSpaceForm>({
      spaceName: new FormControl('', { nonNullable: true, validators: [Validators.required, this.spaceNameTakenValidator()] }),
      quotaDefinition: new FormControl<number | string | null>(null),
    });
    this.validSignal.set(this.createSpaceForm.valid);
    this.formStatusSub = this.createSpaceForm.statusChanges.subscribe(
      () => this.validSignal.set(this.createSpaceForm.valid)
    );

    // Auto-pick the placeholder ("None") option once the base's quota
    // signal populates. Guarded so we only patch once — re-patching on
    // every quota-list re-emit would stomp the user's manual selection.
    let patched = false;
    runInInjectionContext(this.injector, () => {
      effect(() => {
        if (patched) return;
        if (this.quotaDefinitions().length > 0) {
          patched = true;
          this.createSpaceForm.patchValue({ quotaDefinition: 0 });
        }
      });
    });
  }

  isNameUnique = (spaceName: string = null) => {
    const names = this.allSpacesInOrg();
    // Signal returns [] before the org-data load completes. Treat as "no
    // siblings yet, name is OK" so the validator doesn't false-positive
    // during the initial pass that fires before the form is built.
    if (!names || names.length === 0) {
      return true;
    }
    return names.indexOf(spaceName || this.spaceName.value) === -1;
  };

  validate = () => this.validSignal();

  submit: StepOnNextFunction = () => {
    const id = `${this.orgGuid}-${this.spaceName.value}`;
    const quotaValue = this.quotaDefinition.value;
    return cfEntityCatalog.space.api.create<RequestInfoState>(id, this.cfGuid, {
      createSpace: {
        name: this.spaceName.value,
        organization_guid: this.orgGuid,
        space_quota_definition_guid: quotaValue ? String(quotaValue) : undefined as any
      },
      orgGuid: this.orgGuid
    }).pipe(
      pairwise(),
      filter(([oldS, newS]) => oldS.creating && !newS.creating),
      map(([, newS]) => newS),
      this.map('Failed to create space: ')
    );
  };

  ngOnDestroy() {
    this.formStatusSub?.unsubscribe();
    this.destroy();
  }
}
