import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import { CFAppState } from '../../../../../../cloud-foundry/src/cf-app-state';
import { spaceEntityType } from '../../../../../../cloud-foundry/src/cf-entity-types';
import { selectCfRequestInfo } from '../../../../../../cloud-foundry/src/store/selectors/api.selectors';
import { StepOnNextFunction } from '../../../../../../core/src/shared/components/stepper/step/step.component';
import { entityCatalog } from '../../../../../../store/src/entity-catalog/entity-catalog';
import { IEntityMetadata } from '../../../../../../store/src/entity-catalog/entity-catalog.types';
import { PaginationMonitorFactory } from '../../../../../../store/src/monitors/pagination-monitor.factory';
import { CF_ENDPOINT_TYPE } from '../../../../cf-types';
import { SpaceActionBuilders } from '../../../../entity-action-builders/space.action-builders';
import { AddEditSpaceStepBase } from '../../add-edit-space-step-base';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';


@Component({
  selector: 'app-create-space-step',
  templateUrl: './create-space-step.component.html',
  styleUrls: ['./create-space-step.component.scss'],
})
export class CreateSpaceStepComponent extends AddEditSpaceStepBase implements OnInit, OnDestroy {

  cfUrl: string;
  createSpaceForm: FormGroup;
  quotaSubscription: Subscription;

  get spaceName(): any { return this.createSpaceForm ? this.createSpaceForm.get('spaceName') : { value: '' }; }

  get quotaDefinition(): any {
    const control = this.createSpaceForm.get('quotaDefinition');
    const nil = { value: null };

    if (this.createSpaceForm) {
      return (control.value === 0) ? nil : control;
    } else {
      return nil;
    }
  }

  constructor(
    store: Store<CFAppState>,
    activatedRoute: ActivatedRoute,
    paginationMonitorFactory: PaginationMonitorFactory,
    activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
  ) {
    super(store, activatedRoute, paginationMonitorFactory, activeRouteCfOrgSpace);
  }

  ngOnInit() {
    this.createSpaceForm = new FormGroup({
      spaceName: new FormControl('', [Validators.required as any, this.spaceNameTakenValidator()]),
      quotaDefinition: new FormControl(),
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
  }

  validate = () => !!this.createSpaceForm && this.createSpaceForm.valid;

  spaceNameTakenValidator = (): ValidatorFn => {
    return (formField: AbstractControl): { [key: string]: any } =>
      !this.validateNameTaken(formField.value) ? { spaceNameTaken: { value: formField.value } } : null;
  }

  submit: StepOnNextFunction = () => {
    const id = `${this.orgGuid}-${this.spaceName.value}`;
    const spaceEntity = entityCatalog.getEntity<IEntityMetadata, any, SpaceActionBuilders>(
      CF_ENDPOINT_TYPE,
      spaceEntityType
    );
    spaceEntity.actionDispatchManager.dispatchCreate(id, this.cfGuid, {
      createSpace: {
        name: this.spaceName.value,
        organization_guid: this.orgGuid,
        space_quota_definition_guid: this.quotaDefinition.value
      },
      orgGuid: this.orgGuid
    });

    return this.store.select(selectCfRequestInfo(spaceEntityType, id)).pipe(
      filter(o => !!o && !o.fetching && !o.creating),
      this.map('Failed to create space: ')
    );
  }

  ngOnDestroy() {
    this.quotaSubscription.unsubscribe();
    this.destroy();
  }
}
