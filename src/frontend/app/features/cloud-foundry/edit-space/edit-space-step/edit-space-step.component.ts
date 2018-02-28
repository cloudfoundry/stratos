import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { filter, map, tap, take } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import { CfOrgSpaceDataService } from '../../../../shared/data-services/cf-org-space-service.service';
import { CfUserService } from '../../../../shared/data-services/cf-user.service';
import { PaginationMonitorFactory } from '../../../../shared/monitors/pagination-monitor.factory';
import { SpaceSchema, spaceSchemaKey } from '../../../../store/actions/action-types';
import { GetAllSpacesInOrg } from '../../../../store/actions/organisation.actions';
import { getPaginationKey } from '../../../../store/actions/pagination.actions';
import { AppState } from '../../../../store/app-state';
import { getPaginationObservables } from '../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource } from '../../../../store/types/api.types';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import { CloudFoundrySpaceService } from '../../services/cloud-foundry-space.service';
import { UpdateSpace } from '../../../../store/actions/space.actions';
import { selectRequestInfo } from '../../../../store/selectors/api.selectors';
import { RouterNav } from '../../../../store/actions/router.actions';

const cfSpaceServiceFactory = (
  store: Store<AppState>,
  activatedRoute: ActivatedRoute,
  entityServiceFactory: EntityServiceFactory,
  cfOrgSpaceDataService: CfOrgSpaceDataService,
  cfUserService: CfUserService,
  paginationMonitorFactory: PaginationMonitorFactory,
  cfEndpointService: CloudFoundryEndpointService
) => {
  const { orgId, spaceId } = activatedRoute.snapshot.params;
  const { cfGuid } = cfEndpointService;
  return new CloudFoundrySpaceService(
    cfGuid,
    orgId,
    spaceId,
    store,
    entityServiceFactory,
    cfUserService,
    paginationMonitorFactory,
    cfEndpointService
  )
}


@Component({
  selector: 'app-edit-space-step',
  templateUrl: './edit-space-step.component.html',
  styleUrls: ['./edit-space-step.component.scss'],
  providers: [
    {
      provide: CloudFoundrySpaceService,
      useFactory: cfSpaceServiceFactory,
      deps: [
        Store,
        ActivatedRoute,
        EntityServiceFactory,
        CfOrgSpaceDataService,
        CfUserService,
        PaginationMonitorFactory,
        CloudFoundryEndpointService
      ]
    }
  ]
})

export class EditSpaceStepComponent implements OnInit, OnDestroy {

  submitSubscription: Subscription;
  spaceSubscription: Subscription;
  space: string;
  space$: Observable<any>;
  allSpacesInSpace$: Observable<string[]>;
  fetchSpacesSubscription: any;
  allSpacesInOrg: string[];
  spaceGuid: string;
  orgGuid: string;
  cfGuid: string;
  editSpaceForm: FormGroup;
  sshEnabled: boolean;

  constructor(
    private store: Store<AppState>,
    private activatedRoute: ActivatedRoute,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private snackBar: MatSnackBar,
    private cfSpaceService: CloudFoundrySpaceService
  ) {
    const { cfId, orgId, spaceId } = activatedRoute.snapshot.params;
    this.cfGuid = cfId;
    this.orgGuid = orgId;
    this.spaceGuid = spaceId;
    this.sshEnabled = false;
    this.space$ = this.cfSpaceService.space$.pipe(
      tap(o => console.log(o)),
      map(o => o.entity.entity),
      take(1),
      tap(n => {
        this.editSpaceForm = new FormGroup({
          spaceName: new FormControl(n.name),
          toggleSsh: new FormControl(n.allow_ssh),
        });
        this.sshEnabled = n.allow_ssh;
      })
    );

    this.spaceSubscription = this.space$.subscribe();
  }

  ngOnInit() {
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
    const currValue = this.editSpaceForm && this.editSpaceForm.value['space'];
    if (this.allSpacesInOrg) {
      return this.allSpacesInOrg.indexOf(currValue) === -1;
    }
    return true;
  }

  submit = () => {
    const space = this.editSpaceForm.value['spaceName'];
    const enableSsh = this.editSpaceForm.value['toggleSsh'];
    this.store.dispatch(new UpdateSpace(this.spaceGuid, this.cfGuid, {
      name: space,
      allow_ssh: enableSsh
    }))

    // Update action
    this.submitSubscription = this.store.select(selectRequestInfo(spaceSchemaKey, this.spaceGuid)).pipe(
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
  }
}
