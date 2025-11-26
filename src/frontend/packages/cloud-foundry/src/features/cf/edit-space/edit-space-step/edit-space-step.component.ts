import { CommonModule, AsyncPipe } from '@angular/common';
import { Component, type OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { type Observable, of, type Subscription } from 'rxjs';
import { filter, map, pairwise, switchMap, take, tap } from 'rxjs/operators';

import {
  CustomFormFieldComponent,
  CustomSelectComponent,
  CustomOptionComponent,
  CustomSlideToggleComponent,
  AppInputDirective,
  AppErrorComponent,
  FocusDirective,
  type StepOnNextFunction
} from '@stratosui/core';
import type { ActionState, EntityInfo, APIResource } from '@stratosui/store';
import type { CFAppState } from '../../../../cf-app-state';
import type { ISpace } from '../../../../cf-api.types';
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
    AsyncPipe,
    FormsModule,
    ReactiveFormsModule,
    CustomFormFieldComponent,
    CustomSelectComponent,
    CustomOptionComponent,
    CustomSlideToggleComponent,
    AppInputDirective,
    AppErrorComponent,
    FocusDirective
  ]
})
export class EditSpaceStepComponent extends AddEditSpaceStepBase implements OnDestroy {

  originalName!: string;
  spaceSubscription!: Subscription;
  space!: string;
  space$: Observable<EntityInfo<APIResource<ISpace>>>;
  spaceGuid: string;
  editSpaceForm: FormGroup<EditSpaceForm>;
  originalSpaceQuotaGuid!: string;

  constructor(
    store: Store,
    activatedRoute: ActivatedRoute,
    activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private cfSpaceService: CloudFoundrySpaceService,
  ) {
    super(store, activatedRoute, activeRouteCfOrgSpace);
    this.spaceGuid = activatedRoute.snapshot.params.spaceId;
    this.editSpaceForm = new FormGroup<EditSpaceForm>({
      spaceName: new FormControl('', { nonNullable: true, validators: [this.spaceNameTakenValidator()] }),
      toggleSsh: new FormControl(false, { nonNullable: true }),
      quotaDefinition: new FormControl<string | number | null>(null),
    });
    this.space$ = this.cfSpaceService.space$.pipe(
      take(1),
      tap(entityInfo => {
        const space = entityInfo.entity.entity as ISpace;
        this.originalName = space.name;
        this.originalSpaceQuotaGuid = space.space_quota_definition_guid;

        const spaceQuotaGuid = space.space_quota_definition_guid ? space.space_quota_definition_guid : 0;
        this.editSpaceForm.patchValue({
          spaceName: space.name,
          toggleSsh: space.allow_ssh,
          quotaDefinition: spaceQuotaGuid,
        });
      })
    );

    this.spaceSubscription = this.space$.subscribe();
  }

  validate = (spaceName: string = null) => {
    if (this.allSpacesInOrg) {
      return this.allSpacesInOrg
        .filter(o => o !== this.originalName)
        .indexOf(spaceName ? spaceName : this.editSpaceForm.value.spaceName || '') === -1;
    }
    return true;
  };

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
  }
}
