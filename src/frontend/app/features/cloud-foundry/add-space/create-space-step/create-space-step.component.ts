import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { filter } from 'rxjs/operators';

import { PaginationMonitorFactory } from '../../../../shared/monitors/pagination-monitor.factory';
import { spaceSchemaKey } from '../../../../store/actions/action-types';
import { CreateSpace } from '../../../../store/actions/space.actions';
import { AppState } from '../../../../store/app-state';
import { selectRequestInfo } from '../../../../store/selectors/api.selectors';
import { AddEditSpaceStepBase } from '../../add-edit-space-step-base';

@Component({
  selector: 'app-create-space-step',
  templateUrl: './create-space-step.component.html',
  styleUrls: ['./create-space-step.component.scss']
})
export class CreateSpaceStepComponent extends AddEditSpaceStepBase implements OnInit, OnDestroy {

  cfUrl: string;
  createSpaceForm: FormGroup;

  constructor(
    store: Store<AppState>,
    activatedRoute: ActivatedRoute,
    paginationMonitorFactory: PaginationMonitorFactory,
    snackBar: MatSnackBar,
  ) {
    super(store, activatedRoute, paginationMonitorFactory, snackBar);
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

  submit = () => {
    const spaceName = this.createSpaceForm.value['spaceName'];
    this.store.dispatch(new CreateSpace(spaceName, this.orgGuid, this.cfGuid));

    this.submitSubscription = this.store.select(selectRequestInfo(spaceSchemaKey, `${this.orgGuid}-${spaceName}`)).pipe(
      filter(o => !!o && !o.creating),
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
