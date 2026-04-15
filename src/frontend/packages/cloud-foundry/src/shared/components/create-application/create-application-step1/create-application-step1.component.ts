import { CommonModule } from '@angular/common';
import { AfterContentInit, Component, Input, OnInit, ViewChild, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { asapScheduler, Observable, of } from 'rxjs';
import { map, observeOn, startWith, switchMap, withLatestFrom } from 'rxjs/operators';

import { AppErrorComponent, CustomFormFieldComponent, CustomSelectComponent, CustomOptionComponent, FocusDirective, StepOnNextFunction } from '@stratosui/core';
import { SetCFDetails } from '../../../../actions/create-applications-page.actions';
import { ISpace } from '../../../../cf-api.types';
import { CFAppState } from '../../../../cf-app-state';
import { getSpacesFromOrgWithRole } from '../../../../store/selectors/cf-current-user-role.selectors';
import { CfPermissionStrings } from '../../../../user-permissions/cf-user-permissions-checkers';
import { CfOrgSpaceDataService } from '../../../data-services/cf-org-space-service.service';

@Component({
  selector: 'app-create-application-step1',
  templateUrl: './create-application-step1.component.html',
  styleUrls: ['./create-application-step1.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    CustomFormFieldComponent,
    AppErrorComponent,
    CustomSelectComponent,
    CustomOptionComponent,
    FocusDirective
  ]
})
export class CreateApplicationStep1Component implements OnInit, AfterContentInit {
  private store = inject<Store<CFAppState>>(Store);
  cfOrgSpaceService = inject(CfOrgSpaceDataService);
  route = inject(ActivatedRoute);


  @Input()
  isMarketplaceMode!: boolean;

  public spaces$!: Observable<ISpace[]>;
  public hasSpaces$!: Observable<boolean>;
  public hasOrgs$!: Observable<boolean>;

  @ViewChild('cfForm', { static: true })
  cfForm!: NgForm;

  @Input() isRedeploy = false;

  validate!: Observable<boolean>;

  @Input()
  stepperText = 'Select a Cloud Foundry instance, organization and space for the app.';

  /**
   * Cascade clears: selecting "None" on CF should also clear the Org
   * and Space selections. The service has an internal cascade, but it
   * races with org.list$ updates and sometimes leaves the downstream
   * selection stale, so we handle it explicitly here.
   *
   * When the user selects None we also mark the cleared controls as
   * pristine so the "required" error state does not immediately paint
   * red; the fields return to their "nothing chosen yet" state and the
   * Next button stays disabled until the user makes new selections.
   */
  /**
   * Mark a child control pristine AND force it to re-emit statusChanges
   * so the form-field wrapper re-evaluates isInvalid (which is gated on
   * `dirty`). markAsPristine alone does not emit statusChanges.
   */
  private resetControlPristine(name: string) {
    const control = this.cfForm?.control?.get(name);
    if (control) {
      control.markAsPristine();
      control.markAsUntouched();
      control.updateValueAndValidity();
    }
  }

  onCfChange(value: any) {
    this.cfOrgSpaceService.cf.select.next(value);
    if (value == null) {
      this.cfOrgSpaceService.org.select.next(undefined);
      this.cfOrgSpaceService.space.select.next(undefined);
      // Treat None as "back to start" — clear all the dirty/touched
      // marks on every field so the required-error decoration disappears.
      setTimeout(() => {
        this.resetControlPristine('cf');
        this.resetControlPristine('org');
        this.resetControlPristine('space');
      });
    }
  }

  onOrgChange(value: any) {
    this.cfOrgSpaceService.org.select.next(value);
    if (value == null) {
      this.cfOrgSpaceService.space.select.next(undefined);
      // Mark just the cleared fields pristine; the CF field is still
      // the user's real choice so leave its dirty state alone.
      setTimeout(() => {
        this.resetControlPristine('org');
        this.resetControlPristine('space');
      });
    }
  }

  onSpaceChange(value: any) {
    this.cfOrgSpaceService.space.select.next(value);
    if (value == null) {
      setTimeout(() => this.resetControlPristine('space'));
    }
  }

  onNext: StepOnNextFunction = () => {
    this.store.dispatch(new SetCFDetails({
      cloudFoundry: this.cfOrgSpaceService.cf.select.getValue(),
      org: this.cfOrgSpaceService.org.select.getValue(),
      space: this.cfOrgSpaceService.space.select.getValue()
    }));
    return of({ success: true });
  };

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
        return this.store.select(getSpacesFromOrgWithRole(endpointGuid, orgGuid, CfPermissionStrings.SPACE_DEVELOPER));
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
