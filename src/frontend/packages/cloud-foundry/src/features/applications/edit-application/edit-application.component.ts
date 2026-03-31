import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { ReactiveFormsModule, Validators, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { CustomFormFieldComponent } from '@stratosui/core';
import { RouterModule } from '@angular/router';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@stratosui/core';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf, Subscription } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { CustomSlideToggleComponent } from '../../../../../core/src/shared/components/custom-slide-toggle/custom-slide-toggle.component';

import { AppMetadataTypes } from '../../../../../cloud-foundry/src/actions/app-metadata.actions';
import { SetCFDetails, SetNewAppName } from '../../../../../cloud-foundry/src/actions/create-applications-page.actions';
import { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
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
    const updates: { [key: string]: any } = {};
    // We will only send the values that were actually edited
    const formValue = this.editAppForm.value;
    for (const key of Object.keys(formValue)) {
      const control = (this.editAppForm.controls as any)[key];
      if (control && !control.pristine) {
        updates[key] = (formValue as any)[key];
      }
    }

    let obs$: Observable<any>;
    if (Object.keys(updates).length) {
      // We had at least one value to change - send update action
      obs$ = this.applicationService.updateApplication(updates, [AppMetadataTypes.SUMMARY]).pipe(map(v => (
        {
          success: !v.error,
          message: `Could not update application: ${v.message}`
        })));
    } else {
      obs$ = observableOf({ success: true });
    }

    return obs$.pipe(take(1), map(res => {
      return {
        ...res,
        redirect: res.success
      };
    }));
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
