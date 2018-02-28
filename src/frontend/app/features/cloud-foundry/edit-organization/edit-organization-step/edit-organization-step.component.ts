import { Component, OnInit } from '@angular/core';
import { CloudFoundryOrganisationService } from '../../services/cloud-foundry-organisation.service';
import { FormGroup, FormControl } from '@angular/forms';
import { map, take, tap } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';
import { CfOrg } from '../../../../store/types/org-and-space.types';
import { getPaginationKey } from '../../../../store/actions/pagination.actions';
import { GetAllOrganisations } from '../../../../store/actions/organisation.actions';
import { getPaginationObservables } from '../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource } from '../../../../store/types/api.types';
import { OrganisationSchema } from '../../../../store/actions/action-types';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'app-edit-organization-step',
  templateUrl: './edit-organization-step.component.html',
  styleUrls: ['./edit-organization-step.component.scss']
})
export class EditOrganizationStepComponent implements OnInit {

  allOrgsInEndpoint$: Observable<any>;
  orgSubscription: Subscription;
  currentStatus: string;
  originalName: string;
  orgName: string;
  org$: Observable<CfOrg>;
  editOrgName: FormGroup;
  status: boolean;
  cfGuid: string;
  orgGuid: string;
  constructor(
    private store: Store<AppState>,
    private activatedRoute: ActivatedRoute,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private snackBar: MatSnackBar,
    private cfOrgService: CloudFoundryOrganisationService
  ) {
    const { cfId, orgId } = activatedRoute.snapshot.params;
    this.orgGuid = orgId;
    this.cfGuid = cfId;
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
        this.status = n.status;
        this.currentStatus = this.status ? 'Active' : 'Disabled';
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
      tap((o) => this.allSpacesInOrg = o)
    );
    this.fetchSpacesSubscription = this.allSpacesInSpace$.subscribe();
  }

  validate = () => {
    if (this.allSpacesInOrg) {
      return this.allSpacesInOrg
        .filter(o => o !== this.originalName)
        .indexOf(this.orgName) === -1;
    }
    return true;
  }

  submit = () => {
    this.store.dispatch(new UpdateSpace(this.spaceGuid, this.cfGuid, {
      name: this.orgName,
      allow_ssh: this.status
    }));

    // Update action
    this.submitSubscription = this.store.select(selectRequestInfo(spaceSchemaKey, this.spaceGuid)).pipe(
      filter(o => !!o && !o.updating[UpdateSpace.UpdateExistingSpace].busy),
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
    'Failed to update space! Please try again or contact your space manager!',
    'Dismiss'
  )

  ngOnDestroy(): void {
    this.fetchSpacesSubscription.unsubscribe();
    if (this.submitSubscription) {
      this.submitSubscription.unsubscribe();
    }
  }
}
