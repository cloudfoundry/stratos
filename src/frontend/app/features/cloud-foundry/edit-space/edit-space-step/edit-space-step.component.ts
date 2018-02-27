import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../store/app-state';
import { ActivatedRoute } from '@angular/router';
import { PaginationMonitorFactory } from '../../../../shared/monitors/pagination-monitor.factory';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'app-edit-space-step',
  templateUrl: './edit-space-step.component.html',
  styleUrls: ['./edit-space-step.component.scss']
})
export class EditSpaceStepComponent implements OnInit, OnDestroy {

  spaceGuid: string;
  orgGuid: string;
  cfGuid: string;
  editSpaceForm: FormGroup;
  sshEnabled: boolean;

  constructor(
    private store: Store<AppState>,
    private activatedRoute: ActivatedRoute,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private snackBar: MatSnackBar
  ) {
    const { cfId, orgId, spaceId } = activatedRoute.snapshot.params;
    this.cfGuid = cfId;
    this.orgGuid = orgId;
    this.spaceGuid = orgId;
    this.sshEnabled = false;
  }

  ngOnInit() {
    this.editSpaceForm = new FormGroup({
      spaceName: new FormControl(''),
      togglessh: new FormControl(''),
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
    const currValue = this.editSpaceForm && this.editSpaceForm.value['spaceName'];
    if (this.allSpacesInOrg) {
      return this.allSpacesInOrg.indexOf(currValue) === -1;
    }
    return true;
  }

  submit = () => {
    const spaceName = this.editSpaceForm.value['spaceName'];
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
