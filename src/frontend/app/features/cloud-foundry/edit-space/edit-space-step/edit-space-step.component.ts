import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { filter, map, take, tap } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { PaginationMonitorFactory } from '../../../../shared/monitors/pagination-monitor.factory';
import { UpdateSpace } from '../../../../store/actions/space.actions';
import { AppState } from '../../../../store/app-state';
import { spaceSchemaKey } from '../../../../store/helpers/entity-factory';
import { selectRequestInfo } from '../../../../store/selectors/api.selectors';
import { AddEditSpaceStepBase } from '../../add-edit-space-step-base';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { CloudFoundrySpaceService } from '../../services/cloud-foundry-space.service';

@Component({
  selector: 'app-edit-space-step',
  templateUrl: './edit-space-step.component.html',
  styleUrls: ['./edit-space-step.component.scss'],
})

export class EditSpaceStepComponent extends AddEditSpaceStepBase implements OnInit, OnDestroy {

  originalName: any;
  currentSshStatus: string;
  spaceSubscription: Subscription;
  space: string;
  space$: Observable<any>;
  spaceGuid: string;
  editSpaceForm: FormGroup;
  sshEnabled: boolean;
  spaceName: string;

  constructor(
    store: Store<AppState>,
    activatedRoute: ActivatedRoute,
    paginationMonitorFactory: PaginationMonitorFactory,
    snackBar: MatSnackBar,
    activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private cfSpaceService: CloudFoundrySpaceService
  ) {
    super(store, activatedRoute, paginationMonitorFactory, snackBar, activeRouteCfOrgSpace);
    this.orgGuid = this.orgGuid;
    this.spaceGuid = activatedRoute.snapshot.params.spaceId;
    this.sshEnabled = false;
    this.editSpaceForm = new FormGroup({
      spaceName: new FormControl('', this.spaceNameTakenValidator()),
      toggleSsh: new FormControl(false),
    });
    this.space$ = this.cfSpaceService.space$.pipe(
      map(o => o.entity.entity),
      take(1),
      tap(n => {
        this.spaceName = n.name;
        this.originalName = n.name;
        this.sshEnabled = n.allow_ssh;
        this.currentSshStatus = this.sshEnabled ? 'Enabled' : 'Disabled';
      })
    );

    this.spaceSubscription = this.space$.subscribe();
  }

  ngOnInit() {
  }

  validate = (spaceName: string = null) => {
    if (this.allSpacesInOrg) {
      return this.allSpacesInOrg
        .filter(o => o !== this.originalName)
        .indexOf(spaceName ? spaceName : this.spaceName) === -1;
    }
    return true;
  }

  submit = () => {
    this.store.dispatch(new UpdateSpace(this.spaceGuid, this.cfGuid, {
      name: this.spaceName,
      allow_ssh: this.sshEnabled
    }));

    this.submitSubscription = this.store.select(selectRequestInfo(spaceSchemaKey, this.spaceGuid)).pipe(
      filter(o => !!o && !o.updating[UpdateSpace.UpdateExistingSpace].busy),
      this.map(
        ['/cloud-foundry', this.cfGuid, 'organizations', this.orgGuid, 'spaces', this.spaceGuid],
        'Failed to update space! Please try again or contact your space manager!'
      )
    ).subscribe();
    return Observable.of({ success: true });
  }

  ngOnDestroy(): void {
    this.destroy();
  }
}
