import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { ReactiveFormsModule, Validators, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { CustomFormFieldComponent } from '@stratosui/core';
import { RouterModule } from '@angular/router';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@stratosui/core';
import { Store } from '@ngrx/store';
import { defer, from, Observable, of as observableOf, Subscription } from 'rxjs';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';
import { CustomSlideToggleComponent } from '../../../../../core/src/shared/components/custom-slide-toggle/custom-slide-toggle.component';

import { AppMetadataTypes } from '../../../../../cloud-foundry/src/actions/app-metadata.actions';
import { SetCFDetails, SetNewAppName } from '../../../../../cloud-foundry/src/actions/create-applications-page.actions';
import { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import { CfAppsSignalConfigService } from '../../../shared/components/list/list-types/app/cf-apps-signal-config.service';
import { cfEntityCatalog } from '../../../cf-entity-catalog';
import { StatefulIconComponent } from '../../../../../core/src/core/stateful-icon/stateful-icon.component';
import { FocusDirective } from '../../../../../core/src/shared/components/focus.directive';
import { PageHeaderComponent } from '../../../../../core/src/shared/components/page-header/page-header.component';
import { StepComponent } from '../../../../../core/src/shared/components/stepper/step/step.component';
import { StepOnNextFunction } from '../../../../../core/src/shared/components/stepper/step/step.component';
import { SteppersComponent } from '../../../../../core/src/shared/components/stepper/steppers/steppers.component';
import {
  AppNameUniqueChecking,
  AppNameUniqueDirective,
} from '../../../shared/directives/app-name-unique.directive/app-name-unique.directive';
import { ApplicationService } from '../application.service';

interface EditApplicationForm {
  name: FormControl<string>;
  instances: FormControl<number>;
  disk_quota: FormControl<number>;
  memory: FormControl<number>;
  enable_ssh: FormControl<boolean>;
}

@Component({
  selector: 'app-edit-application',
  templateUrl: './edit-application.component.html',
  styleUrls: ['./edit-application.component.scss'],
  providers: [
    { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher }
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    CustomFormFieldComponent,
    CustomSlideToggleComponent,
    PageHeaderComponent,
    SteppersComponent,
    StepComponent,
    StatefulIconComponent,
    FocusDirective,
  ]
})
export class EditApplicationComponent implements OnInit, OnDestroy {
  applicationService = inject(ApplicationService);
  private store = inject<Store<CFAppState>>(Store);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private apps = inject(CfAppsSignalConfigService);


  editAppForm: FormGroup<EditApplicationForm>;

  uniqueNameValidator: AppNameUniqueDirective;

  appNameChecking: AppNameUniqueChecking = new AppNameUniqueChecking();

  constructor() {
    this.uniqueNameValidator = new AppNameUniqueDirective();
    this.editAppForm = this.fb.group<EditApplicationForm>({
      name: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
        asyncValidators: [this.uniqueNameValidator as any]
      }),
      instances: new FormControl(0, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(0)]
      }),
      disk_quota: new FormControl(0, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(1)]
      }),
      memory: new FormControl(0, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(1)]
      }),
      enable_ssh: new FormControl(false, { nonNullable: true })
    });
  }

  private app: any = {
    entity: {}
  };

  private sub: Subscription;

  private error = false;

  ngOnInit() {
    this.sub = this.applicationService.application$.pipe(
      filter(app => !!app.app.entity),
      take(1),
      map(app => app.app.entity)
    ).subscribe(app => {
      this.app = app;
      this.store.dispatch(new SetCFDetails({
        cloudFoundry: this.applicationService.cfGuid,
        org: '',
        space: this.app.space_guid,
      }));

      this.store.dispatch(new SetNewAppName(this.app.name));
      this.editAppForm.setValue({
        name: this.app.name,
        instances: this.app.instances,
        memory: this.app.memory,
        disk_quota: this.app.disk_quota,
        enable_ssh: this.app.enable_ssh,
      });
      // Don't want the values to change while the user is editing
      this.clearSub();
    });
  }

  updateApp: StepOnNextFunction = () => {
    // Split the dirty form fields into scale (instances/memory/disk_quota,
    // handled by the Stratos async-job contract via scaleApp) and non-scale
    // (name/enable_ssh, still routed through the legacy updateApplication
    // NGRX action until those fields get their own native endpoints).
    const scaleUpdate: { instances?: number; memory?: number; disk_quota?: number } = {};
    const otherUpdates: { [key: string]: any } = {};
    const formValue = this.editAppForm.value;
    for (const key of Object.keys(formValue)) {
      const control = (this.editAppForm.controls as any)[key];
      if (!control || control.pristine) continue;
      const value = (formValue as any)[key];
      if (key === 'instances' || key === 'memory' || key === 'disk_quota') {
        (scaleUpdate as any)[key] = value;
      } else {
        otherUpdates[key] = value;
      }
    }

    const hasScale = Object.keys(scaleUpdate).length > 0;
    const hasOther = Object.keys(otherUpdates).length > 0;
    if (!hasScale && !hasOther) {
      return observableOf({ success: true, redirect: true });
    }

    const { cfGuid, appGuid } = this.applicationService;
    const scale$: Observable<{ success: boolean; message?: string }> = hasScale
      ? defer(() => from(this.apps.scaleApp(cfGuid, appGuid, scaleUpdate))).pipe(
          map(() => ({ success: true })),
          // Surface failure message so the stepper can display it in the
          // snackbar. writeWithJob throws StratosJobError on FAILED terminal;
          // Promise.catch would lose the type, so cast via unknown.
        )
      : observableOf({ success: true });

    const other$: Observable<{ success: boolean; message?: string }> = hasOther
      ? this.applicationService.updateApplication(otherUpdates, [AppMetadataTypes.SUMMARY]).pipe(
          map(v => ({
            success: !v.error,
            message: v.error ? `Could not update application: ${v.message}` : undefined,
          })),
        )
      : observableOf({ success: true });

    return scale$.pipe(
      take(1),
      // After scale resolves, run the legacy update (if any). A scale
      // failure short-circuits the other update so we don't half-persist.
      switchMap(scaleRes => {
        if (!scaleRes.success) return observableOf(scaleRes);
        return other$.pipe(take(1));
      }),
      // Refresh the local app entity cache once all writes complete so the
      // summary card reflects the new memory/disk/instances/ssh values.
      // Also refresh per-instance stats — the legacy updateApplication path
      // used AppMetadataTypes.STATS to do this implicitly; scaleApp bypasses
      // ngrx, so without an explicit getMultiple here the Instances tab's
      // table freezes at whatever state the last poll saw (typically
      // "STARTING" for the newly-created container).
      tap(res => {
        if (res.success && hasScale) {
          cfEntityCatalog.application.api.get(appGuid, cfGuid, {});
          cfEntityCatalog.appStats.actions.getMultiple(appGuid, cfGuid);
        }
      }),
      map(res => ({ ...res, redirect: res.success })),
    );
  }

  clearSub() {
    if (this.sub) {
      this.sub.unsubscribe();
      this.sub = undefined;
    }
  }

  ngOnDestroy() {
    this.clearSub();
  }
}
