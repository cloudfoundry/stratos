import { CommonModule } from '@angular/common';
import { CustomFormFieldComponent } from '@stratosui/core';
import { Component, OnDestroy, OnInit , ChangeDetectionStrategy } from '@angular/core';
import { AbstractControl, ReactiveFormsModule, ValidatorFn, Validators, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { CustomSelectComponent, CustomOptionComponent } from '../../../../../../core/src/shared/components/custom-select/custom-select.component';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { filter, map, pairwise } from 'rxjs/operators';

import { FocusDirective } from '../../../../../../core/src/shared/components/focus.directive';
import { StepOnNextFunction } from '../../../../../../core/src/shared/components/stepper/step/step.component';
import { RequestInfoState } from '../../../../../../store/src/reducers/api-request-reducer/types';
import { CFAppState } from '../../../../cf-app-state';
import { cfEntityCatalog } from '../../../../cf-entity-catalog';
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
    CustomFormFieldComponent,
    CustomSelectComponent,
    CustomOptionComponent,
    FocusDirective
  ]
})
export class CreateSpaceStepComponent extends AddEditSpaceStepBase implements OnInit, OnDestroy {

  cfUrl!: string;
  createSpaceForm!: FormGroup<CreateSpaceForm>;
  quotaSubscription!: Subscription;

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

  constructor(
    store: Store<CFAppState>,
    activatedRoute: ActivatedRoute,
    activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private fb: FormBuilder,
  ) {
    super(store, activatedRoute, activeRouteCfOrgSpace);
  }

  ngOnInit() {
    this.createSpaceForm = this.fb.group<CreateSpaceForm>({
      spaceName: new FormControl('', { nonNullable: true, validators: [Validators.required, this.spaceNameTakenValidator()] }),
      quotaDefinition: new FormControl<number | string | null>(null),
    });

    this.quotaSubscription = this.quotaDefinitions$.subscribe((quotas => {
      if (quotas.length > 0) {
        this.createSpaceForm.patchValue({
          quotaDefinition: 0
        });
      }
    }));
  }

  validateNameTaken = (spaceName: string = null) => {
    return this.allSpacesInOrg ? this.allSpacesInOrg.indexOf(spaceName || this.spaceName.value) === -1 : true;
  };

  validate = () => !!this.createSpaceForm && this.createSpaceForm.valid;

  spaceNameTakenValidator = (): ValidatorFn => {
    return (formField: AbstractControl): { [key: string]: any, } =>
      !this.validateNameTaken(formField.value) ? { spaceNameTaken: { value: formField.value } } : null;
  };

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
    this.quotaSubscription.unsubscribe();
    this.destroy();
  }
}
