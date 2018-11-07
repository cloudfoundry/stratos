import { Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { filter, map, take, tap } from 'rxjs/operators';

import { StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import { PaginationMonitorFactory } from '../../../../shared/monitors/pagination-monitor.factory';
import { AddEditSpaceStepBase } from '../../add-edit-space-step-base';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { CloudFoundrySpaceService } from '../../services/cloud-foundry-space.service';
import { AppState } from '../../../../../../store/src/app-state';
import { UpdateSpace } from '../../../../../../store/src/actions/space.actions';
import { selectRequestInfo } from '../../../../../../store/src/selectors/api.selectors';
import { spaceSchemaKey } from '../../../../../../store/src/helpers/entity-factory';


@Component({
  selector: 'app-edit-space-step',
  templateUrl: './edit-space-step.component.html',
  styleUrls: ['./edit-space-step.component.scss'],
})
export class EditSpaceStepComponent extends AddEditSpaceStepBase implements OnDestroy {

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
    activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private cfSpaceService: CloudFoundrySpaceService
  ) {
    super(store, activatedRoute, paginationMonitorFactory, activeRouteCfOrgSpace);
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

  validate = (spaceName: string = null) => {
    if (this.allSpacesInOrg) {
      return this.allSpacesInOrg
        .filter(o => o !== this.originalName)
        .indexOf(spaceName ? spaceName : this.spaceName) === -1;
    }
    return true;
  }

  submit: StepOnNextFunction = () => {
    this.store.dispatch(new UpdateSpace(this.spaceGuid, this.cfGuid, {
      name: this.spaceName,
      allow_ssh: this.sshEnabled
    }));

    return this.store.select(selectRequestInfo(spaceSchemaKey, this.spaceGuid)).pipe(
      filter(o => !!o && !o.updating[UpdateSpace.UpdateExistingSpace].busy),
      map((state) => state.updating[UpdateSpace.UpdateExistingSpace]),
      this.map('Failed to update space: ')
    );
  }

  ngOnDestroy() {
    this.destroy();
  }
}
