import { Component, OnInit, OnDestroy } from '@angular/core';
import { CloudFoundryOrganisationService } from '../../services/cloud-foundry-organisation.service';
import { FormGroup, FormControl } from '@angular/forms';
import { map, take, tap, filter } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';
import { getPaginationKey } from '../../../../store/actions/pagination.actions';
import { GetAllOrganisations, UpdateOrganization } from '../../../../store/actions/organisation.actions';
import { getPaginationObservables } from '../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource } from '../../../../store/types/api.types';
import { OrganisationSchema, organisationSchemaKey } from '../../../../store/actions/action-types';
import { Subscription } from 'rxjs/Subscription';
import { IOrganization } from '../../../../core/cf-api.types';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../store/app-state';
import { ActivatedRoute } from '@angular/router';
import { PaginationMonitorFactory } from '../../../../shared/monitors/pagination-monitor.factory';
import { MatSnackBar } from '@angular/material';
import { selectRequestInfo } from '../../../../store/selectors/api.selectors';
import { RouterNav } from '../../../../store/actions/router.actions';
import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import { CfOrgSpaceDataService } from '../../../../shared/data-services/cf-org-space-service.service';
import { CfUserService } from '../../../../shared/data-services/cf-user.service';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import { BaseCFOrg } from '../../cf-page.types';

const enum OrgStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended'
}
function getOrgIdFromRouter(activatedRoute: ActivatedRoute) {
  return {
    guid: activatedRoute.snapshot.params.orgId
  };
}

@Component({
  selector: 'app-edit-organization-step',
  templateUrl: './edit-organization-step.component.html',
  styleUrls: ['./edit-organization-step.component.scss'],
  providers: [
    {provide: BaseCFOrg, useFactory: getOrgIdFromRouter, deps:[ActivatedRoute]},
    CloudFoundryOrganisationService
  ]
})
export class EditOrganizationStepComponent implements OnInit, OnDestroy {

  submitSubscription: Subscription;
  fetchOrgsSub: Subscription;
  allOrgsInEndpoint: any;
  allOrgsInEndpoint$: Observable<any>;
  orgSubscription: Subscription;
  currentStatus: string;
  originalName: string;
  orgName: string;
  org$: Observable<IOrganization>;
  editOrgName: FormGroup;
  status: boolean;
  cfGuid: string;
  orgGuid: string;
  constructor(
    private store: Store<AppState>,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private snackBar: MatSnackBar,
    private cfOrgService: CloudFoundryOrganisationService
  ) {
    this.orgGuid = cfOrgService.orgGuid;
    this.cfGuid = cfOrgService.cfGuid;
    this.status = false;
    this.editOrgName = new FormGroup({
      orgName: new FormControl(''),
      toggleStatus: new FormControl(false),
    });
    this.org$ = this.cfOrgService.org$.pipe(
      map(o => o.entity.entity),
      take(1),
      tap(n => {
        this.orgName = n.name;
        this.originalName = n.name;
        this.status = n.status === OrgStatus.ACTIVE ? true : false;
        this.currentStatus = n.status;
      })
    );

    this.orgSubscription = this.org$.subscribe();
  }

  ngOnInit() {
    const paginationKey = getPaginationKey('cf-org', this.cfGuid);
    const action = new GetAllOrganisations(paginationKey, this.cfGuid);
    this.allOrgsInEndpoint$ = getPaginationObservables<APIResource>(
      {
        store: this.store,
        action,
        paginationMonitor: this.paginationMonitorFactory.create(
          action.paginationKey,
          OrganisationSchema
        )
      },
      true
    ).entities$.pipe(
      filter(o => !!o),
      map(o => o.map(org => org.entity.name)),
      tap((o) => this.allOrgsInEndpoint = o)
    );
    this.fetchOrgsSub = this.allOrgsInEndpoint$.subscribe();
  }

  validate = () => {
    if (this.allOrgsInEndpoint) {
      return this.allOrgsInEndpoint
        .filter(o => o !== this.originalName)
        .indexOf(this.orgName) === -1;
    }
    return true;
  }

  submit = () => {
    this.store.dispatch(new UpdateOrganization(this.orgGuid, this.cfGuid, {
      name: this.orgName,
      status: this.status ? OrgStatus.ACTIVE : OrgStatus.SUSPENDED
    }));

    // Update action
    this.submitSubscription = this.store.select(selectRequestInfo(organisationSchemaKey, this.orgGuid)).pipe(
      filter(o => !!o && !o.updating[UpdateOrganization.UpdateExistingOrg].busy),
      map(o => {
        if (o.error) {
          this.displaySnackBar();
        } else {
          this.store.dispatch(
            new RouterNav({
              path: ['/cloud-foundry', this.cfGuid, 'organizations']
            })
          );
        }
      })
    ).subscribe();
    return Observable.of({ success: true });
  }

  displaySnackBar = () => this.snackBar.open(
    'Failed to update organization! Please try again or contact your organization manager!',
    'Dismiss'
  )

  ngOnDestroy(): void {
    this.fetchOrgsSub.unsubscribe();
    if (this.submitSubscription) {
      this.submitSubscription.unsubscribe();
    }
  }
}
