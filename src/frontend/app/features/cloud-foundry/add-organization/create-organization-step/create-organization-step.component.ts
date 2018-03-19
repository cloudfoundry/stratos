import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { filter, map, tap } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { IOrganization } from '../../../../core/cf-api.types';
import { PaginationMonitorFactory } from '../../../../shared/monitors/pagination-monitor.factory';
import { CreateOrganization } from '../../../../store/actions/organization.actions';
import { RouterNav } from '../../../../store/actions/router.actions';
import { AppState } from '../../../../store/app-state';
import { entityFactory, organizationSchemaKey } from '../../../../store/helpers/entity-factory';
import { getPaginationObservables } from '../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { selectRequestInfo } from '../../../../store/selectors/api.selectors';
import { APIResource } from '../../../../store/types/api.types';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';

@Component({
  selector: 'app-create-organization-step',
  templateUrl: './create-organization-step.component.html',
  styleUrls: ['./create-organization-step.component.scss']
})
export class CreateOrganizationStepComponent implements OnInit, OnDestroy {

  orgSubscription: Subscription;
  submitSubscription: Subscription;
  cfGuid: string;
  allOrgs: string[];
  orgs$: Observable<APIResource<IOrganization>[]>;
  cfUrl: string;
  addOrg: FormGroup;

  constructor(
    private store: Store<AppState>,
    private activatedRoute: ActivatedRoute,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private snackBar: MatSnackBar
  ) {
    this.cfGuid = activatedRoute.snapshot.params.cfId;
  }

  ngOnInit() {
    this.addOrg = new FormGroup({
      orgName: new FormControl('', [<any>Validators.required]),
    });
    const action = CloudFoundryEndpointService.createGetAllOrganizations(this.cfGuid);
    this.orgs$ = getPaginationObservables<APIResource>(
      {
        store: this.store,
        action,
        paginationMonitor: this.paginationMonitorFactory.create(
          action.paginationKey,
          entityFactory(organizationSchemaKey)
        )
      },
      true
    ).entities$.pipe(
      filter(o => !!o),
      map(o => o.map(org => org.entity.name)),
      tap((o) => this.allOrgs = o)
    );

    this.orgSubscription = this.orgs$.subscribe();
  }

  validate = () => {
    const currValue = this.addOrg && this.addOrg.value['orgName'];
    if (this.allOrgs) {
      return this.allOrgs.indexOf(currValue) === -1;
    }
    return true;
  }

  submit = () => {
    const orgName = this.addOrg.value['orgName'];
    this.store.dispatch(new CreateOrganization(orgName, this.cfGuid));

    this.submitSubscription = this.store.select(selectRequestInfo(organizationSchemaKey, orgName)).pipe(
      filter(o => !!o && !o.creating),
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
    'Failed to create organization! Please select a different name and try again!',
    'Dismiss'
  )
  ngOnDestroy(): void {
    this.orgSubscription.unsubscribe();
    if (this.submitSubscription) {
      this.submitSubscription.unsubscribe();
    }
  }
}
