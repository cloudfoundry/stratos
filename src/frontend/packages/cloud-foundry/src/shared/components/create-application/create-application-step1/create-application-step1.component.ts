import { AfterContentInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { asapScheduler, Observable, of } from 'rxjs';
import { map, observeOn, startWith, switchMap, withLatestFrom } from 'rxjs/operators';

import { PermissionStrings } from '../../../../../../core/src/core/current-user-permissions.config';
import { StepOnNextFunction } from '../../../../../../core/src/shared/components/stepper/step/step.component';
import { SetCFDetails } from '../../../../actions/create-applications-page.actions';
import { ISpace } from '../../../../cf-api.types';
import { CFAppState } from '../../../../cf-app-state';
import { getSpacesFromOrgWithRole } from '../../../../store/selectors/cf-current-user-role.selectors';
import { CfOrgSpaceDataService } from '../../../data-services/cf-org-space-service.service';

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

  @ViewChild('cfForm', { static: true })
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
    return of({ success: true });
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
