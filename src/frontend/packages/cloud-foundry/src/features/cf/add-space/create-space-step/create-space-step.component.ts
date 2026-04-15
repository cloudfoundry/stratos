import { CommonModule } from '@angular/common';
import { AppInputDirective, CustomFormFieldComponent } from '@stratosui/core';
import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
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
    AppInputDirective,
    CustomFormFieldComponent,
    CustomSelectComponent,
    CustomOptionComponent,
    FocusDirective
  ]
})
export class CreateSpaceStepComponent extends AddEditSpaceStepBase implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);

  /** See QuotaDefinitionFormComponent for rationale. */
  private validSignal = signal(false);
  private formStatusSub?: Subscription;

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

  constructor() {
    const store = inject<Store<CFAppState>>(Store);
    const activatedRoute = inject(ActivatedRoute);
    const activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);

    super(store, activatedRoute, activeRouteCfOrgSpace);
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

    this.quotaSubscription = this.quotaDefinitions$.subscribe((quotas => {
      if (quotas.length > 0) {
        this.createSpaceForm.patchValue({
          quotaDefinition: 0
        });
      }
    }));
  }

  isNameUnique = (spaceName: string = null) => {
    return this.allSpacesInOrg ? this.allSpacesInOrg.indexOf(spaceName || this.spaceName.value) === -1 : true;
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
    this.quotaSubscription.unsubscribe();
    this.formStatusSub?.unsubscribe();
    this.destroy();
  }
}
