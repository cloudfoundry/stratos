import { CommonModule, AsyncPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, type OnDestroy, type OnInit , ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, Validators, FormControl, type FormGroup, type AsyncValidatorFn, FormBuilder } from '@angular/forms';
import {
  CustomFormFieldComponent,
  AppInputDirective,
  AppErrorComponent,
  ErrorStateMatcher,
  ShowOnDirtyErrorStateMatcher,
  CustomSlideToggleComponent,
  StatefulIconComponent,
  FocusDirective,
  PageHeaderComponent,
  StepComponent,
  SteppersComponent,
  type StepOnNextFunction
} from '@stratosui/core';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { type Observable, of as observableOf, type Subscription } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';

import { AppMetadataTypes } from '../../../../../cloud-foundry/src/actions/app-metadata.actions';
import { SetCFDetails, SetNewAppName } from '../../../../../cloud-foundry/src/actions/create-applications-page.actions';
import type { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import type { IApp } from '../../../cf-api.types';
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
    AsyncPipe,
    ReactiveFormsModule,
    RouterModule,
    CustomFormFieldComponent,
    AppInputDirective,
    AppErrorComponent,
    CustomSlideToggleComponent,
    PageHeaderComponent,
    SteppersComponent,
    StepComponent,
    StatefulIconComponent,
    FocusDirective,
  ]
})
export class EditApplicationComponent implements OnInit, OnDestroy {

  editAppForm: FormGroup<EditApplicationForm>;

  uniqueNameValidator: AppNameUniqueDirective;

  appNameChecking: AppNameUniqueChecking = new AppNameUniqueChecking();

  constructor(
    public applicationService: ApplicationService,
    private store: Store,
    private fb: FormBuilder,
    private http: HttpClient,
  ) {
    this.uniqueNameValidator = new AppNameUniqueDirective(this.store, this.http);
    this.editAppForm = this.fb.group<EditApplicationForm>({
      name: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
        asyncValidators: [this.uniqueNameValidator.validate.bind(this.uniqueNameValidator) as AsyncValidatorFn]
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

  private app: IApp<unknown> = {} as IApp<unknown>;

  private sub: Subscription;

  private error = false;

  ngOnInit() {
    this.sub = this.applicationService.application$.pipe(
      filter(app => !!app.app.entity),
      take(1),
      map(app => app.app.entity)
    ).subscribe(app => {
      this.app = app as IApp<unknown>;
      this.store.dispatch(new SetCFDetails({
        cloudFoundry: this.applicationService.cfGuid,
        org: '',
        space: this.app.space_guid as string,
      }));

      this.store.dispatch(new SetNewAppName(this.app.name as string));
      this.editAppForm.setValue({
        name: this.app.name as string,
        instances: this.app.instances as number,
        memory: this.app.memory as number,
        disk_quota: this.app.disk_quota as number,
        enable_ssh: this.app.enable_ssh as boolean,
      });
      // Don't want the values to change while the user is editing
      this.clearSub();
    });
  }

  updateApp: StepOnNextFunction = () => {
    const updates: Partial<IApp> = {};
    // We will only send the values that were actually edited
    const formValue = this.editAppForm.value;
    for (const key of Object.keys(formValue)) {
      const control = this.editAppForm.controls[key as keyof typeof this.editAppForm.controls];
      if (control && !control.pristine) {
        (updates as Record<string, unknown>)[key] = formValue[key as keyof typeof formValue];
      }
    }

    let obs$: Observable<{ success: boolean; message?: string; }>;
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
