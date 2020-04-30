import { Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, of, Subscription } from 'rxjs';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';

import { AssociateSpaceQuota } from '../../../../../../cloud-foundry/src/actions/quota-definitions.actions';
import { UpdateSpace } from '../../../../../../cloud-foundry/src/actions/space.actions';
import { CFAppState } from '../../../../../../cloud-foundry/src/cf-app-state';
import { StepOnNextFunction } from '../../../../../../core/src/shared/components/stepper/step/step.component';
import { RequestInfoState } from '../../../../../../store/src/reducers/api-request-reducer/types';
import { cfEntityCatalog } from '../../../../cf-entity-catalog';
import { AddEditSpaceStepBase } from '../../add-edit-space-step-base';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { CloudFoundrySpaceService } from '../../services/cloud-foundry-space.service';


@Component({
  selector: 'app-edit-space-step',
  templateUrl: './edit-space-step.component.html',
  styleUrls: ['./edit-space-step.component.scss'],
})
export class EditSpaceStepComponent extends AddEditSpaceStepBase implements OnDestroy {

  originalName: any;
  spaceSubscription: Subscription;
  space: string;
  space$: Observable<any>;
  spaceGuid: string;
  editSpaceForm: FormGroup;
  originalSpaceQuotaGuid: string;
  spaceName: string;

  constructor(
    store: Store<CFAppState>,
    activatedRoute: ActivatedRoute,
    activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private cfSpaceService: CloudFoundrySpaceService,
  ) {
    super(store, activatedRoute, activeRouteCfOrgSpace);
    this.spaceGuid = activatedRoute.snapshot.params.spaceId;
    this.editSpaceForm = new FormGroup({
      spaceName: new FormControl('', this.spaceNameTakenValidator()),
      toggleSsh: new FormControl(false),
      quotaDefinition: new FormControl(),
    });
    this.space$ = this.cfSpaceService.space$.pipe(
      map(o => o.entity.entity),
      take(1),
      tap(n => {
        this.spaceName = n.name;
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

  validate = (spaceName: string = null) => {
    if (this.allSpacesInOrg) {
      return this.allSpacesInOrg
        .filter(o => o !== this.originalName)
        .indexOf(spaceName ? spaceName : this.spaceName) === -1;
    }
    return true;
  }

  submit: StepOnNextFunction = () => {
    const spaceQuotaGuid = this.editSpaceForm.value.quotaDefinition;

    return this.updateSpace$().pipe(
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

        return this.updateSpaceQuota$();
      }),
    );
  }

  updateSpace$() {
    return cfEntityCatalog.space.api.update<RequestInfoState>(this.spaceGuid, this.cfGuid, {
      name: this.editSpaceForm.value.spaceName,
      allow_ssh: this.editSpaceForm.value.toggleSsh as boolean,
    }).pipe(
      filter(o => !!o && !o.updating[UpdateSpace.UpdateExistingSpace].busy),
      map((state) => state.updating[UpdateSpace.UpdateExistingSpace])
    );
  }

  updateSpaceQuota$() {
    const spaceQuotaGuid = this.editSpaceForm.value.quotaDefinition;
    const mon = spaceQuotaGuid ?
      cfEntityCatalog.spaceQuota.api.associateWithSpace<RequestInfoState>(this.spaceGuid, this.cfGuid, spaceQuotaGuid) :
      cfEntityCatalog.spaceQuota.api.disassociateFromSpace<RequestInfoState>(this.spaceGuid, this.cfGuid, this.originalSpaceQuotaGuid)
    return mon.pipe(
      filter(o => {
        return !!o &&
          o.updating[AssociateSpaceQuota.UpdateExistingSpaceQuota] &&
          !o.updating[AssociateSpaceQuota.UpdateExistingSpaceQuota].busy;
      }),
      map((state) => state.updating[AssociateSpaceQuota.UpdateExistingSpaceQuota]),
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
