import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, Validators, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { CustomFormFieldComponent } from '@stratosui/core';
import { Router, RouterModule } from '@angular/router';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@stratosui/core';
import { defer, firstValueFrom, from, Observable, of as observableOf, Subscription } from 'rxjs';
import { filter, map, startWith, switchMap, take, tap } from 'rxjs/operators';
import { CustomSlideToggleComponent } from '../../../../../core/src/shared/components/custom-slide-toggle/custom-slide-toggle.component';

import { CfAppsSignalConfigService } from '../../../shared/signal-list-configs/app/cf-apps-signal-config.service';
import { CreateAppStateService } from '../../../shared/data-services/create-app-state.service';
import { AppDetailDataService } from '../app-detail-data.service';
import { StatefulIconComponent } from '../../../../../core/src/core/stateful-icon/stateful-icon.component';
import { FocusDirective } from '../../../../../core/src/shared/components/focus.directive';
import { PageHeaderComponent } from '../../../../../core/src/shared/components/page-header/page-header.component';
import { StepComponent, SignalStepHandle } from '../../../../../core/src/shared/components/stepper/step/step.component';
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
  private createAppState = inject(CreateAppStateService);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private apps = inject(CfAppsSignalConfigService);
  private router = inject(Router);
  private detail = inject(AppDetailDataService);


  editAppForm: FormGroup<EditApplicationForm>;

  // FWT-957: signal-native step handle. Single-step edit form; submit() runs
  // updateApp() and on success navigates back to the app detail page (the
  // legacy { redirect: true } behavior, made explicit). Validity is the
  // form's valid+dirty status, computed reactively from statusChanges.
  signalHandle!: SignalStepHandle;

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

    // Track form valid+dirty as a signal so signalHandle.valid is reactive
    // without the legacy onValidChange emitter chain. Combine statusChanges
    // and valueChanges so we react to BOTH validator transitions and dirty-
    // flag flips (markAsDirty fires on valueChanges, not statusChanges).
    const formChanges$ = this.editAppForm.statusChanges.pipe(
      startWith(this.editAppForm.status),
      map(() => this.editAppForm.valid && this.editAppForm.dirty),
    );
    const valueChanges$ = this.editAppForm.valueChanges.pipe(
      map(() => this.editAppForm.valid && this.editAppForm.dirty),
    );
    // toSignal each stream as a "version tick" — the actual valid && dirty
    // truth is read fresh inside the computed. ORing the ticks ensures the
    // signal graph re-runs when either stream emits.
    const statusTick = toSignal(formChanges$, {
      initialValue: this.editAppForm.valid && this.editAppForm.dirty,
    });
    const valueTick = toSignal(valueChanges$, { initialValue: false });
    this.signalHandle = {
      valid: computed(() => {
        // Touch both ticks so the computed depends on both streams; then
        // read the live form state for the actual answer.
        statusTick(); valueTick();
        return this.editAppForm.valid && this.editAppForm.dirty;
      }),
      submit: async () => {
        const result = await firstValueFrom(this.updateApp(0, undefined as any));
        if (!result.success) {
          throw new Error(result.message || 'Failed to update application');
        }
        // Legacy path returned { redirect: true } so the stepper popped back
        // to the previous router state. Make that navigation explicit so we
        // don't rely on the deprecated stepper redirect plumbing.
        await this.router.navigate(
          ['/applications', this.applicationService.cfGuid, this.applicationService.appGuid],
        );
      },
    };
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
      this.createAppState.setCFDetails({
        cloudFoundry: this.applicationService.cfGuid,
        org: '',
        space: this.app.space_guid,
      });

      this.createAppState.setName(this.app.name);
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
      ? defer(() => from(this.detail.update(otherUpdates as { name?: string; enable_ssh?: boolean }))).pipe(
          map(() => ({ success: true })),
        )
      : observableOf({ success: true });

    return scale$.pipe(
      take(1),
      // After scale resolves, run the name/ssh PATCH (if any). A scale
      // failure short-circuits the other update so we don't half-persist.
      switchMap(scaleRes => {
        if (!scaleRes.success) return observableOf(scaleRes);
        return other$.pipe(take(1));
      }),
      // Refresh per-instance stats after a scale so the Instances tab's
      // table reflects the new container count. detail.update() already
      // refreshed the app entity on success — only stats needs a separate
      // kick (scaleApp goes through the async-job path and doesn't touch
      // AppDetailDataService).
      tap(res => {
        if (res.success && hasScale) {
          void this.detail.refresh('stats');
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
