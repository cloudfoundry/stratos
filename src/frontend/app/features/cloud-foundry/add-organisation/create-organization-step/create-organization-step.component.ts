import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../store/app-state';
import { BaseCF } from '../../cf-page.types';
import { APIResource } from '../../../../store/types/api.types';
import { DomainSchema } from '../../../../store/actions/domains.actions';
import { getPaginationObservables } from '../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { GetAllOrganisations, CreateOrganization } from '../../../../store/actions/organisation.actions';
import { getPaginationKey } from '../../../../store/actions/pagination.actions';
import { PaginationMonitorFactory } from '../../../../shared/monitors/pagination-monitor.factory';
import { OrganisationSchema } from '../../../../store/actions/action-types';
import { CfOrg } from '../../../../store/types/org-and-space.types';
import { filter, map, tap } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { RouterNav } from '../../../../store/actions/router.actions';
import { selectRequestInfo } from '../../../../store/selectors/api.selectors';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material';

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
  orgs$: Observable<APIResource<CfOrg>[]>;
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
    const paginationKey = getPaginationKey('cf-organizations', this.cfGuid);
    const action = new GetAllOrganisations(paginationKey);
    this.orgs$ = getPaginationObservables<APIResource>(
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

    this.submitSubscription = this.store.select(selectRequestInfo(OrganisationSchema.key, orgName)).pipe(
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
    this.submitSubscription.unsubscribe();
  }
}
