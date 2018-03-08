import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../store/app-state';
import { BaseCF } from '../../cf-page.types';
import { APIResource } from '../../../../store/types/api.types';
import { getPaginationObservables } from '../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { CreateOrganization } from '../../../../store/actions/organisation.actions';
import { getPaginationKey } from '../../../../store/actions/pagination.actions';
import { PaginationMonitorFactory } from '../../../../shared/monitors/pagination-monitor.factory';
import { filter, map, tap } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';
import { RouterNav } from '../../../../store/actions/router.actions';
import { selectRequestInfo } from '../../../../store/selectors/api.selectors';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material';
import { IOrganization } from '../../../../core/cf-api.types';
import { entityFactory, organisationSchemaKey } from '../../../../store/helpers/entity-factory';
import { CfOrgsDataSourceService } from '../../../../shared/components/list/list-types/cf-orgs/cf-orgs-data-source.service';

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
    // const paginationKey = getPaginationKey('cf-organizations', this.cfGuid);
    // TODO: RC Specific inludes for this request
    const action = CfOrgsDataSourceService.createGetAllOrganisations(this.cfGuid);
    this.orgs$ = getPaginationObservables<APIResource>(
      {
        store: this.store,
        action,
        paginationMonitor: this.paginationMonitorFactory.create(
          action.paginationKey,
          entityFactory(organisationSchemaKey)
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

    this.submitSubscription = this.store.select(selectRequestInfo(organisationSchemaKey, orgName)).pipe(
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
