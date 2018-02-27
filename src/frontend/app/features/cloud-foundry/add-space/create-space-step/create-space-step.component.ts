import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Observable } from 'rxjs/Observable';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { CfSpace } from '../../../../store/types/org-and-space.types';
import { APIResource } from '../../../../store/types/api.types';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../store/app-state';
import { ActivatedRoute } from '@angular/router';
import { PaginationMonitorFactory } from '../../../../shared/monitors/pagination-monitor.factory';
import { MatSnackBar } from '@angular/material';
import { getPaginationKey } from '../../../../store/actions/pagination.actions';
import { GetAllSpacesInOrg } from '../../../../store/actions/organisation.actions';
import { getPaginationObservables } from '../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { SpaceSchema, spaceSchemaKey } from '../../../../store/actions/action-types';
import { filter, map, tap } from 'rxjs/operators';
import { CreateSpace } from '../../../../store/actions/space.actions';
import { selectRequestInfo } from '../../../../store/selectors/api.selectors';
import { RouterNav } from '../../../../store/actions/router.actions';
import { BaseCF } from '../../cf-page.types';

@Component({
  selector: 'app-create-space-step',
  templateUrl: './create-space-step.component.html',
  styleUrls: ['./create-space-step.component.scss']
})
export class CreateSpaceStepComponent implements OnInit {

  orgGuid: string;
  allSpacesInOrg: string[];
  fetchSpacesSubscription: Subscription;
  submitSubscription: Subscription;
  cfGuid: string;
  allSpacesInSpace$: Observable<APIResource<CfSpace>[]>;
  cfUrl: string;
  createSpaceForm: FormGroup;

  constructor(
    private store: Store<AppState>,
    private activatedRoute: ActivatedRoute,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private snackBar: MatSnackBar
  ) {
    this.cfGuid = activatedRoute.snapshot.params.cfId;
    this.orgGuid = activatedRoute.snapshot.params.orgId;
  }

  ngOnInit() {
    this.createSpaceForm = new FormGroup({
      spaceName: new FormControl('', [<any>Validators.required]),
    });
    const paginationKey = getPaginationKey('cf-space', this.cfGuid, this.orgGuid);
    const action = new GetAllSpacesInOrg(this.cfGuid, this.orgGuid, paginationKey);
    this.allSpacesInSpace$ = getPaginationObservables<APIResource>(
      {
        store: this.store,
        action,
        paginationMonitor: this.paginationMonitorFactory.create(
          action.paginationKey,
          SpaceSchema
        )
      },
      true
    ).entities$.pipe(
      filter(o => !!o),
      map(o => o.map(org => org.entity.name)),
      tap((o) => this.allSpacesInOrg = o)
    );

    this.fetchSpacesSubscription = this.allSpacesInSpace$.subscribe();
  }

  validate = () => {
    const currValue = this.createSpaceForm && this.createSpaceForm.value['spaceName'];
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
      map(o => {
        if (o.error) {
          this.displaySnackBar();
        } else {
          this.store.dispatch(
            new RouterNav({
              path: ['/cloud-foundry', this.cfGuid, 'organizations', this.orgGuid, 'spaces']
            })
          );
        }
      })
    ).subscribe();
    return Observable.of({ success: true });
  }

  displaySnackBar = () => this.snackBar.open(
    'Failed to create space! Please select a different name and try again!',
    'Dismiss'
  )

  ngOnDestroy(): void {
    this.fetchSpacesSubscription.unsubscribe();
    if (this.submitSubscription) {
      this.submitSubscription.unsubscribe();
    }
  }
}
