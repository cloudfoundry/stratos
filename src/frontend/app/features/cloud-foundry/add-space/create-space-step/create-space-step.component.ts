import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { filter } from 'rxjs/operators';

import { PaginationMonitorFactory } from '../../../../shared/monitors/pagination-monitor.factory';
import { CreateSpace } from '../../../../store/actions/space.actions';
import { AppState } from '../../../../store/app-state';
import { selectRequestInfo } from '../../../../store/selectors/api.selectors';
import { AddEditSpaceStepBase } from '../../add-edit-space-step-base';
import { spaceSchemaKey } from '../../../../store/helpers/entity-factory';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';

@Component({
  selector: 'app-create-space-step',
  templateUrl: './create-space-step.component.html',
  styleUrls: ['./create-space-step.component.scss'],
})
export class CreateSpaceStepComponent extends AddEditSpaceStepBase implements OnInit, OnDestroy {

  cfUrl: string;
  createSpaceForm: FormGroup;

  constructor(
    store: Store<AppState>,
    activatedRoute: ActivatedRoute,
    paginationMonitorFactory: PaginationMonitorFactory,
    snackBar: MatSnackBar,
    activeRouteCfOrgSpace: ActiveRouteCfOrgSpace
  ) {
    super(store, activatedRoute, paginationMonitorFactory, snackBar, activeRouteCfOrgSpace);
  }

  ngOnInit() {
    this.createSpaceForm = new FormGroup({
      spaceName: new FormControl('', [<any>Validators.required, this.spaceNameTakenValidator()]),
    });
  }

  validate = (spaceName: string = null) => {
    const currValue = spaceName ? spaceName : this.createSpaceForm && this.createSpaceForm.value['spaceName'];
    if (this.allSpacesInOrg) {
      return this.allSpacesInOrg.indexOf(currValue) === -1;
    }
    return true;
  }

  spaceNameTakenValidator = (): ValidatorFn => {
    return (formField: AbstractControl): { [key: string]: any } => {
      const nameInvalid = this.validate();
      return nameInvalid ? { 'spaceNameTaken': { value: formField.value } } : null;
    };
  }

  submit = () => {
    const spaceName = this.createSpaceForm.value['spaceName'];
    this.store.dispatch(new CreateSpace(spaceName, this.orgGuid, this.cfGuid));

    this.submitSubscription = this.store.select(selectRequestInfo(spaceSchemaKey, `${this.orgGuid}-${spaceName}`)).pipe(
      filter(o => {
        return !!o && !o.fetching && !o.creating;
      }),
      this.map(
        ['/cloud-foundry', this.cfGuid, 'organizations', this.orgGuid, 'spaces'],
        'Failed to create space! Please select a different name and try again!'
      )
    ).subscribe();
    return Observable.of({ success: true });
  }

  ngOnDestroy(): void {
    this.destroy();
  }
}
