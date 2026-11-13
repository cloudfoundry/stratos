import { CommonModule } from '@angular/common';
import { AfterContentInit, Component, Injector, OnInit, Signal, ChangeDetectionStrategy, computed, inject, input, viewChild } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { asapScheduler, Observable } from 'rxjs';
import { map, observeOn, startWith, switchMap, withLatestFrom } from 'rxjs/operators';

import { observeSignal } from '@stratosui/store';
import { AppErrorComponent, CustomFormFieldComponent, CustomSelectComponent, CustomOptionComponent, FocusDirective, StepOnNextResult } from '@stratosui/core';
import { ISpace } from '../../../../cf-api.types';
import { CfCurrentUserRolesDataService } from '../../../../services/cf-current-user-roles-data.service';
import { CfPermissionStrings } from '../../../../user-permissions/cf-user-permissions-checkers';
import { CfOrgSpaceDataService } from '../../../data-services/cf-org-space-service.service';
import { CreateAppStateService } from '../../../data-services/create-app-state.service';

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
  private cfCurrentUserRoles = inject(CfCurrentUserRolesDataService);
  private injector = inject(Injector);
  private createAppState = inject(CreateAppStateService);
  cfOrgSpaceService = inject(CfOrgSpaceDataService);
  route = inject(ActivatedRoute);


  readonly isMarketplaceMode = input<boolean>();

  public spaces$!: Observable<ISpace[]>;
  public hasSpaces$!: Observable<boolean>;
  // Signal-native — direct computed over the service's org.list signal.
  // Template reads as `hasOrgs()`.
  public hasOrgs: Signal<boolean> = computed(() => this.cfOrgSpaceService.org.list().length > 0);

  readonly cfForm = viewChild.required<NgForm>('cfForm');

  readonly isRedeploy = input(false);

  // A deploy scoped to an endpoint arrives with an `endpointGuid` query
  // param (e.g. from a CF's Applications tab). The CF is fixed for the
  // whole flow, so we pre-select AND lock the Cloud Foundry dropdown —
  // org / space stay selectable. Distinct from isRedeploy, which locks
  // all three.
  endpointScoped = false;

  validate!: Observable<boolean>;

  readonly stepperText = input('Select a Cloud Foundry instance, organization and space for the app.');

  // The heading shown. A redeploy and the marketplace flow have their own
  // text, which replaces the bound one.
  protected readonly heading = computed(() => {
    if (this.isMarketplaceMode()) {
      return 'Select an organization and space for the service instance.';
    }
    if (this.isRedeploy()) {
      return 'Review the Cloud Foundry instance, organization and space for the app.';
    }
    return this.stepperText();
  });

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
    const control = this.cfForm()?.control?.get(name);
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

  async onNext(): Promise<StepOnNextResult> {
    this.createAppState.setCFDetails({
      cloudFoundry: this.cfOrgSpaceService.cf.select(),
      org: this.cfOrgSpaceService.org.select(),
      space: this.cfOrgSpaceService.space.select()
    });
    return { success: true };
  }

  ngOnInit() {
    if (this.route.root.snapshot.queryParams.endpointGuid) {
      this.cfOrgSpaceService.cf.select.set(this.route.root.snapshot.queryParams.endpointGuid);
      this.endpointScoped = true;
    }
    this.spaces$ = this.getSpacesFromPermissions();
    this.hasSpaces$ = this.spaces$.pipe(
      map(spaces => !!spaces.length)
    );
  }

  ngAfterContentInit() {
    // strict: cfForm is a `static: true` ViewChild, so the NgForm and its
    // statusChanges stream are initialised by the time ngAfterContentInit runs.
    this.validate = this.cfForm().statusChanges!.pipe(
      startWith(this.cfForm().valid || this.isRedeploy()),
      map(() => this.cfForm().valid || this.isRedeploy()),
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
        return observeSignal(
          this.cfCurrentUserRoles.spacesWithRoleInOrg(endpointGuid!, orgGuid!, CfPermissionStrings.SPACE_DEVELOPER),
          this.injector,
        );
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
