import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, Injector, inject, signal, Input } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
import { cfEntityCatalog } from '../../../../cf-entity-catalog';
import { OrgDataRegistry } from '../../../../services/endpoint-data/org-data.registry';
import { QuotaDataService } from '../../../../services/endpoint-data/quota-data.service';
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
  private injector = inject(Injector);
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
    const activatedRoute = inject(ActivatedRoute);
    const activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);
    const orgRegistry = inject(OrgDataRegistry);
    const quotaData = inject(QuotaDataService);

    super(activatedRoute, activeRouteCfOrgSpace, orgRegistry, quotaData);
    this.spaceGuid = activatedRoute.snapshot.params.spaceId;
    this.editSpaceForm = new FormGroup<EditSpaceForm>({
      spaceName: new FormControl('', { nonNullable: true, validators: [this.spaceNameTakenValidator()] }),
      toggleSsh: new FormControl(false, { nonNullable: true }),
      quotaDefinition: new FormControl<string | number | null>(null),
    });
    // V3-native: source the form-prefill from the SpaceDataService signal.
    // Map V3 field names (allowSsh, quotaGuid) back onto the form's V2 keys
    // (allow_ssh, space_quota_definition_guid) so the rest of the form
    // pipeline stays unchanged.
    this.space$ = toObservable(this.cfSpaceService.spaceDataService.space, { injector: this.injector }).pipe(
      filter((o): o is NonNullable<typeof o> => !!o),
      map(o => ({
        name: o.name,
        allow_ssh: o.allowSsh,
        space_quota_definition_guid: o.quotaGuid || undefined,
      })),
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
    const names = this.allSpacesInOrg();
    // Signal returns [] before the org-data load completes — treat as
    // "no known siblings yet, name is OK" so the form validator doesn't
    // false-positive during construction. Also guards against the
    // initial validator pass running before editSpaceForm is assigned.
    if (!names || names.length === 0 || !this.editSpaceForm) {
      return true;
    }
    return names
      .filter(o => o !== this.originalName)
      .indexOf(spaceName ? spaceName : this.editSpaceForm.value.spaceName || '') === -1;
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
