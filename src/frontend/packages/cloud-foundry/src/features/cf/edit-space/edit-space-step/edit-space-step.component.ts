import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, inject, signal, Input } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { firstValueFrom, Observable, of, Subscription } from 'rxjs';
import { filter, map, pairwise, switchMap, take, tap } from 'rxjs/operators';

import {
  AppInputDirective,
  CustomFormFieldComponent,
  CustomSelectComponent,
  CustomOptionComponent,
  CustomSlideToggleComponent,
  FocusDirective,
  SignalStepHandle,
  StepOnNextFunction
} from '@stratosui/core';
import { ActionState } from '@stratosui/store';
import { CFAppState } from '../../../../cf-app-state';
import { cfEntityCatalog } from '../../../../cf-entity-catalog';
import { AddEditSpaceStepBase } from '../../add-edit-space-step-base';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { CloudFoundrySpaceService } from '../../services/cloud-foundry-space.service';

interface EditSpaceForm {
  spaceName: FormControl<string>;
  toggleSsh: FormControl<boolean>;
  quotaDefinition: FormControl<string | number | null>;
}


@Component({
  selector: 'app-edit-space-step',
  templateUrl: './edit-space-step.component.html',
  styleUrls: ['./edit-space-step.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AppInputDirective,
    CustomFormFieldComponent,
    CustomSelectComponent,
    CustomOptionComponent,
    CustomSlideToggleComponent,
    FocusDirective
  ]
})
export class EditSpaceStepComponent extends AddEditSpaceStepBase implements OnInit, OnDestroy {
  private cfSpaceService = inject(CloudFoundrySpaceService);
  private router = inject(Router);

  /** See QuotaDefinitionFormComponent for rationale. */
  private validSignal = signal(false);
  private formStatusSub?: Subscription;

  /** FWT-957: post-success navigation target supplied by parent. */
  @Input() redirectUrl!: string;

  /**
   * FWT-957: signal-native step handle. Performs the two-stage update
   * (space attributes, then optional quota change) and navigates to the
   * parent-supplied redirectUrl on success. Replaces legacy onNext.
   */
  signalHandle: SignalStepHandle = {
    valid: this.validSignal.asReadonly(),
    submit: async () => {
      const spaceQuotaGuid = this.editSpaceForm.value.quotaDefinition;
      const spaceState = await firstValueFrom(this.updateSpace());
      if (spaceState.error) {
        throw new Error(`Failed to update space: ${spaceState.message}`);
      }
      const quotaUnchanged = this.originalSpaceQuotaGuid === spaceQuotaGuid ||
        (!this.originalSpaceQuotaGuid && !spaceQuotaGuid);
      if (!quotaUnchanged) {
        const quotaResult = await firstValueFrom(this.updateSpaceQuota());
        if (!quotaResult.success) {
          throw new Error(quotaResult.message || 'Failed to update space quota');
        }
      }
      await this.router.navigateByUrl(this.redirectUrl);
    },
  };

  originalName: any;
  spaceSubscription!: Subscription;
  space!: string;
  space$: Observable<any>;
  spaceGuid: string;
  editSpaceForm: FormGroup<EditSpaceForm>;
  originalSpaceQuotaGuid!: string;

  constructor() {
    const store = inject<Store<CFAppState>>(Store);
    const activatedRoute = inject(ActivatedRoute);
    const activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);

    super(store, activatedRoute, activeRouteCfOrgSpace);
    this.spaceGuid = activatedRoute.snapshot.params.spaceId;
    this.editSpaceForm = new FormGroup<EditSpaceForm>({
      spaceName: new FormControl('', { nonNullable: true, validators: [this.spaceNameTakenValidator()] }),
      toggleSsh: new FormControl(false, { nonNullable: true }),
      quotaDefinition: new FormControl<string | number | null>(null),
    });
    this.space$ = this.cfSpaceService.space$.pipe(
      map(o => o.entity.entity),
      take(1),
      tap(n => {
        this.originalName = n.name;
        this.originalSpaceQuotaGuid = n.space_quota_definition_guid;

        const spaceQuotaGuid = n.space_quota_definition_guid ? n.space_quota_definition_guid : 0;
        this.editSpaceForm.patchValue({
          spaceName: n.name,
          toggleSsh: n.allow_ssh,
          quotaDefinition: spaceQuotaGuid,
        });
      })
    );

    this.spaceSubscription = this.space$.subscribe();
  }

  /** Name uniqueness check used by the base class's spaceNameTakenValidator. */
  isNameUnique = (spaceName: string = null): boolean => {
    if (this.allSpacesInOrg) {
      return this.allSpacesInOrg
        .filter(o => o !== this.originalName)
        .indexOf(spaceName ? spaceName : this.editSpaceForm.value.spaceName || '') === -1;
    }
    return true;
  };

  /** Form-level validity gate for the Update button. Reads the signal. */
  validate = () => this.validSignal();

  ngOnInit() {
    // Mirror editSpaceForm.valid && dirty into a signal so the parent
    // EditSpaceComponent re-evaluates [valid] automatically.
    this.validSignal.set(this.editSpaceForm.valid && this.editSpaceForm.dirty);
    this.formStatusSub = this.editSpaceForm.statusChanges.subscribe(
      () => this.validSignal.set(this.editSpaceForm.valid && this.editSpaceForm.dirty)
    );
  }

  submit: StepOnNextFunction = () => {
    const spaceQuotaGuid = this.editSpaceForm.value.quotaDefinition;

    return this.updateSpace().pipe(
      switchMap((spaceStateAction) => {
        let message = '';

        if (spaceStateAction.error) {
          message = spaceStateAction.message;

          return of({
            success: false,
            redirect: false,
            message: `Failed to update space: ${message}`
          });
        }

        if (this.originalSpaceQuotaGuid === spaceQuotaGuid ||
          (!this.originalSpaceQuotaGuid && !spaceQuotaGuid)) {
          return of({ success: true, redirect: true });
        }

        return this.updateSpaceQuota();
      }),
    );
  };

  updateSpace() {
    return cfEntityCatalog.space.api.update<ActionState>(this.spaceGuid, this.cfGuid, {
      name: this.editSpaceForm.value.spaceName,
      allow_ssh: this.editSpaceForm.value.toggleSsh as boolean,
    }).pipe(
      pairwise(),
      filter(([oldS, newS]) => oldS.busy && !newS.busy),
      map(([, newS]) => newS),
    );
  }

  updateSpaceQuota() {
    const spaceQuotaGuid = this.editSpaceForm.value.quotaDefinition;
    const mon = spaceQuotaGuid ?
      cfEntityCatalog.spaceQuota.api.associateWithSpace<ActionState>(this.spaceGuid, this.cfGuid, String(spaceQuotaGuid)) :
      cfEntityCatalog.spaceQuota.api.disassociateFromSpace<ActionState>(this.spaceGuid, this.cfGuid, this.originalSpaceQuotaGuid);
    return mon.pipe(
      pairwise(),
      filter(([oldS, newS]) => oldS.busy && !newS.busy),
      map(([, newS]) => newS),
      map(stateAction => ({
        success: !stateAction.error,
        redirect: !stateAction.error,
        message: !stateAction.error ? '' : `Failed to update space quota: ${stateAction.message}`
      }))
    );
  }

  ngOnDestroy() {
    this.destroy();
    this.spaceSubscription.unsubscribe();
    this.formStatusSub?.unsubscribe();
  }
}
