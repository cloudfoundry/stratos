import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter } from 'rxjs/operators';

import { StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import { PaginationMonitorFactory } from '../../../../shared/monitors/pagination-monitor.factory';
import { CreateSpace } from '../../../../store/actions/space.actions';
import { AppState } from '../../../../store/app-state';
import { spaceSchemaKey } from '../../../../store/helpers/entity-factory';
import { selectRequestInfo } from '../../../../store/selectors/api.selectors';
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
  get spaceName(): any { return this.createSpaceForm ? this.createSpaceForm.get('spaceName') : { value: '' }; }

  constructor(
    store: Store<AppState>,
    activatedRoute: ActivatedRoute,
    paginationMonitorFactory: PaginationMonitorFactory,
    activeRouteCfOrgSpace: ActiveRouteCfOrgSpace
  ) {
    super(store, activatedRoute, paginationMonitorFactory, activeRouteCfOrgSpace);
  }

  ngOnInit() {
    this.createSpaceForm = new FormGroup({
      spaceName: new FormControl('', [<any>Validators.required, this.spaceNameTakenValidator()]),
    });
  }

  validateNameTaken = (spaceName: string = null) =>
    this.allSpacesInOrg ? this.allSpacesInOrg.indexOf(spaceName || this.spaceName.value) === -1 : true

  validate = () => !!this.createSpaceForm && this.createSpaceForm.valid;

  spaceNameTakenValidator = (): ValidatorFn => {
    return (formField: AbstractControl): { [key: string]: any } =>
      !this.validateNameTaken(formField.value) ? { 'spaceNameTaken': { value: formField.value } } : null;
  }

  submit: StepOnNextFunction = () => {
    const spaceName = this.createSpaceForm.value['spaceName'];
    this.store.dispatch(new CreateSpace(spaceName, this.orgGuid, this.cfGuid));

    return this.store.select(selectRequestInfo(spaceSchemaKey, `${this.orgGuid}-${spaceName}`)).pipe(
      filter(o => !!o && !o.fetching && !o.creating),
      this.map('Failed to create space: ')
    );
  }

  ngOnDestroy() {
    this.destroy();
  }
}
