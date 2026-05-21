import { CommonModule } from '@angular/common';
import { AfterContentInit, Component, Input, OnInit, Signal, ViewChild, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@stratosui/store';
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
  host: { class: 'app-host-flex-1' },
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
  // Signal-native — direct computed over the service's org.list signal.
  // Template reads as `hasOrgs()`.
  public hasOrgs: Signal<boolean> = computed(() => this.cfOrgSpaceService.org.list().length > 0);

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
    this.cfOrgSpaceService.cf.select.set(value);
    if (value == null) {
      this.cfOrgSpaceService.org.select.set(null);
      this.cfOrgSpaceService.space.select.set(null);
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
    this.cfOrgSpaceService.org.select.set(value);
    if (value == null) {
      this.cfOrgSpaceService.space.select.set(null);
      // Mark just the cleared fields pristine; the CF field is still
      // the user's real choice so leave its dirty state alone.
      setTimeout(() => {
        this.resetControlPristine('org');
        this.resetControlPristine('space');
      });
    }
  }

  onSpaceChange(value: any) {
    this.cfOrgSpaceService.space.select.set(value);
    if (value == null) {
      setTimeout(() => this.resetControlPristine('space'));
    }
  }

  onNext: StepOnNextFunction = () => {
    this.store.dispatch(new SetCFDetails({
      cloudFoundry: this.cfOrgSpaceService.cf.select(),
      org: this.cfOrgSpaceService.org.select(),
      space: this.cfOrgSpaceService.space.select()
    }));
    return of({ success: true });
  };

  ngOnInit() {
    if (this.route.root.snapshot.queryParams.endpointGuid) {
      this.cfOrgSpaceService.cf.select.set(this.route.root.snapshot.queryParams.endpointGuid);
    }
    this.spaces$ = this.getSpacesFromPermissions();
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

  // Signal-bridges captured at field-init time (toObservable requires an
  // injection context — only ctor / field initializers / explicit
  // runInInjectionContext satisfy that, not arbitrary methods). The
  // chain still ends in `store.select(...)` which is ngrx-Observable,
  // so we keep the rxjs composition here; only the CfOrgSpaceDataService
  // signal reads are bridged.
  private orgSelect$ = toObservable(this.cfOrgSpaceService.org.select);
  private cfSelect$ = toObservable(this.cfOrgSpaceService.cf.select);
  private spaceList$ = toObservable(this.cfOrgSpaceService.space.list);

  private getSpacesFromPermissions() {
    return this.orgSelect$.pipe(
      withLatestFrom(this.cfSelect$),
      switchMap(([orgGuid, endpointGuid]) => {
        return this.store.select(getSpacesFromOrgWithRole(endpointGuid!, orgGuid!, CfPermissionStrings.SPACE_DEVELOPER));
      }),
      switchMap((spacesOrAll => {
        if (spacesOrAll === 'all') {
          return this.spaceList$;
        }
        const spaceIds = spacesOrAll as string[];
        return this.spaceList$.pipe(
          map(spaces => {
            const filteredSpaces = spaces.filter(space => spaceIds.find(spaceGuid => spaceGuid === space.guid));
            return filteredSpaces;
          })
        );
      }))
    );
  }
}
