import { AfterContentInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { asapScheduler, Observable, of as observableOf } from 'rxjs';
import { map, observeOn, startWith, switchMap, withLatestFrom } from 'rxjs/operators';

import { SetCFDetails } from '../../../../../../cloud-foundry/src/actions/create-applications-page.actions';
import { CFAppState } from '../../../../../../cloud-foundry/src/cf-app-state';
import {
  CfOrgSpaceDataService,
} from '../../../../../../cloud-foundry/src/shared/data-services/cf-org-space-service.service';
import {
  getSpacesFromOrgWithRole,
} from '../../../../../../cloud-foundry/src/store/selectors/cf-current-user-role.selectors';
import { ISpace } from '../../../../core/cf-api.types';
import { PermissionStrings } from '../../../../core/current-user-permissions.config';
import { StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';

@Component({
  selector: 'app-create-application-step1',
  templateUrl: './create-application-step1.component.html',
  styleUrls: ['./create-application-step1.component.scss'],
})
export class CreateApplicationStep1Component implements OnInit, AfterContentInit {

  @Input()
  isMarketplaceMode: boolean;
  constructor(
    private store: Store<CFAppState>,
    public cfOrgSpaceService: CfOrgSpaceDataService,
    public route: ActivatedRoute
  ) { }

  public spaces$: Observable<ISpace[]>;
  public hasSpaces$: Observable<boolean>;
  public hasOrgs$: Observable<boolean>;

  @ViewChild('cfForm')
  cfForm: NgForm;

  @Input() isRedeploy = false;

  validate: Observable<boolean>;

  @Input()
  stepperText = 'Select a Cloud Foundry instance, organization and space for the app.';

  onNext: StepOnNextFunction = () => {
    this.store.dispatch(new SetCFDetails({
      cloudFoundry: this.cfOrgSpaceService.cf.select.getValue(),
      org: this.cfOrgSpaceService.org.select.getValue(),
      space: this.cfOrgSpaceService.space.select.getValue()
    }));
    return observableOf({ success: true });
  }

  ngOnInit() {
    if (this.route.root.snapshot.queryParams.endpointGuid) {
      this.cfOrgSpaceService.cf.select.next(this.route.root.snapshot.queryParams.endpointGuid);
    }
    this.spaces$ = this.getSpacesFromPermissions();
    this.hasOrgs$ = this.cfOrgSpaceService.org.list$.pipe(
      map(o => o && o.length > 0)
    );
    this.hasSpaces$ = this.spaces$.pipe(
      map(spaces => !!spaces.length)
    );
    if (this.isRedeploy) {
      this.stepperText = 'Review the Cloud Foundry instance, organization and space for the app.';
    }

    if (this.isMarketplaceMode) {
      this.stepperText = 'Select an organization and space for the service instance.';
    }
  }

  ngAfterContentInit() {
    this.validate = this.cfForm.statusChanges.pipe(
      startWith(this.cfForm.valid || this.isRedeploy),
      map(() => this.cfForm.valid || this.isRedeploy),
      observeOn(asapScheduler)
    );
  }

  private getSpacesFromPermissions() {
    return this.cfOrgSpaceService.org.select.pipe(
      withLatestFrom(this.cfOrgSpaceService.cf.select),
      switchMap(([orgGuid, endpointGuid]) => {
        return this.store.select(getSpacesFromOrgWithRole(endpointGuid, orgGuid, PermissionStrings.SPACE_DEVELOPER));
      }),
      switchMap((spacesOrAll => {
        if (spacesOrAll === 'all') {
          return this.cfOrgSpaceService.space.list$;
        }
        const spaceIds = spacesOrAll as string[];
        return this.cfOrgSpaceService.space.list$.pipe(
          map(spaces => {
            const filteredSpaces = spaces.filter(space => spaceIds.find(spaceGuid => spaceGuid === space.guid));
            return filteredSpaces;
          })
        );
      }))
    );
  }
}
