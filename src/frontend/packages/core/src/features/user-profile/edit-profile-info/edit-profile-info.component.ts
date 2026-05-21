import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, ReactiveFormsModule, FormBuilder, FormGroup, FormControl, ValidatorFn, Validators } from '@angular/forms';
import { CustomFormFieldComponent } from '../../../shared/components/custom-form-field/custom-form-field.component';
import { Router, RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '../../../shared/services/tailwind-error-state-matcher';
import { UserProfileInfo, UserProfileInfoUpdates } from '@stratosui/store';
import { Subscription, firstValueFrom } from 'rxjs';
import { defaultIfEmpty, take } from 'rxjs/operators';

import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { StratosCurrentUserPermissions } from '../../../core/permissions/stratos-user-permissions.checker';
import { UserProfileService } from '../../../core/user-profile.service';
import { ShowHideButtonComponent } from '../../../core/show-hide-button/show-hide-button.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { SignalStepHandle, StepComponent } from '../../../shared/components/stepper/step/step.component';
// StepOnNextFunction no longer needed — submit lives on signalHandle.
import { SteppersComponent } from '../../../shared/components/stepper/steppers/steppers.component';
import { CustomIconComponent } from '../../../shared/components/custom-material/custom-material.component';

interface EditProfileForm {
  givenName: FormControl<string>;
  familyName: FormControl<string>;
  emailAddress: FormControl<string>;
  currentPassword: FormControl<string>;
  newPassword: FormControl<string>;
  confirmPassword: FormControl<string>;
}

@Component({
  selector: 'app-edit-profile-info',
  templateUrl: './edit-profile-info.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher }
  ],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    CustomFormFieldComponent,
    CustomIconComponent,
    PageHeaderComponent,
    SteppersComponent,
    StepComponent,
    ShowHideButtonComponent
  ]
})
export class EditProfileInfoComponent implements OnInit, OnDestroy {
  private userProfileService = inject(UserProfileService);
  private fb = inject(FormBuilder);
  private currentUserPermissionsService = inject(CurrentUserPermissionsService);
  private router = inject(Router);


  editProfileForm: FormGroup<EditProfileForm>;
  showPassword: boolean[] = [];

  needsPasswordForEmailChange: boolean;

  // FWT-957: signal-native step handle. Form-edit step (Shape 2):
  // valid tracks `form.valid && form.dirty`; submit awaits the legacy
  // updateProfile observable, throws on error to surface as step failure,
  // and explicitly navigates back to /user-profile on success (replacing
  // the legacy `redirect: true` behavior).
  signalHandle: SignalStepHandle;

  constructor() {
    this.editProfileForm = this.fb.group<EditProfileForm>({
      givenName: new FormControl('', { nonNullable: true }),
      familyName: new FormControl('', { nonNullable: true }),
      emailAddress: new FormControl('', { nonNullable: true }),
      currentPassword: new FormControl('', { nonNullable: true }),
      newPassword: new FormControl('', { nonNullable: true }),
      confirmPassword: new FormControl('', { nonNullable: true }) });

    this.needsPasswordForEmailChange = false;

    // Track form validity + dirty as a signal so the step's Next button
    // mirrors the legacy `[valid]="editProfileForm.valid && editProfileForm.dirty"`.
    const formStateChanges = toSignal(this.editProfileForm.statusChanges, {
      initialValue: this.editProfileForm.status,
    });
    const isDirty = signal(this.editProfileForm.dirty);
    this.editProfileForm.valueChanges.subscribe(() => isDirty.set(this.editProfileForm.dirty));
    const formValid = computed(() => formStateChanges() === 'VALID' && isDirty());

    this.signalHandle = {
      valid: formValid,
      submit: async () => {
        const updates: UserProfileInfoUpdates = {};
        // We will only send the values that were actually edited
        for (const key of Object.keys(this.editProfileForm.value)) {
          const control = this.editProfileForm.get(key);
          if (control && !control.pristine) {
            (updates as any)[key] = this.editProfileForm.value[key as keyof EditProfileForm];
          }
        }
        const [profileResult, passwordResult] = await firstValueFrom(
          this.userProfileService.updateProfile(this.profile, updates).pipe(take(1))
        );
        if (profileResult.error || passwordResult.error) {
          const message = `${profileResult.message || ''}${passwordResult.message || ''}`;
          throw new Error(`An error occurred whilst updating your profile: ${message}`);
        }
        // Mirror legacy `delay(300)` then refresh + redirect.
        await new Promise(resolve => setTimeout(resolve, 300));
        this.userProfileService.fetchUserProfile();
        await this.router.navigate(['/user-profile']);
      },
    };
  }

  private sub!: Subscription;

  private profile!: UserProfileInfo;

  private lastRequired = false;
  private lastHavePassword = false;

  private emailAddress!: string;

  // Only allow password change if user has the 'password.write' group
  public canChangePassword = this.currentUserPermissionsService.can(StratosCurrentUserPermissions.PASSWORD_CHANGE);

  public passwordRequired = false;

  ngOnInit() {
    this.userProfileService.userProfile$.pipe(take(1), defaultIfEmpty(null)).subscribe(profile => {
      if (!profile) { return; }
      // UAA needs the user's password for email changes. Local user does not
      // Both need it for password change
      this.needsPasswordForEmailChange = (profile.origin === 'uaa');
      this.profile = profile;
      this.emailAddress = this.userProfileService.getPrimaryEmailAddress(profile);
      this.editProfileForm.patchValue({
        givenName: profile.name.givenName,
        familyName: profile.name.familyName,
        emailAddress: this.userProfileService.getPrimaryEmailAddress(profile),
        currentPassword: '',
        newPassword: '',
        confirmPassword: '' });
    });
    this.onChanges();
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  onChanges() {
    this.sub = this.editProfileForm.valueChanges.subscribe(values => {
      // Old password is required if either email or new pw is specified (uaa)
      // or only if new pw is specified (local account)
      const required = this.needsPasswordForEmailChange ?
        (values.emailAddress !== this.emailAddress || !!(values.newPassword ?? '').length) : !!(values.newPassword ?? '').length;
      this.passwordRequired = required;
      if (required !== this.lastRequired) {
        this.lastRequired = required;
        const validators = required ? [Validators.required] : [];
        this.editProfileForm.get('currentPassword')?.setValidators(validators);
        this.editProfileForm.get('currentPassword')?.updateValueAndValidity();
      }
      const havePassword = !!(values.newPassword ?? '').length;
      if (havePassword !== this.lastHavePassword) {
        this.lastHavePassword = havePassword;
        const confirmValidator = havePassword ? [Validators.required, this.confirmPasswordValidator()] : [];
        this.editProfileForm.get('confirmPassword')?.setValidators(confirmValidator);
        this.editProfileForm.get('confirmPassword')?.updateValueAndValidity();
      }
    });
  }

  confirmPasswordValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      const same = control.value === this.editProfileForm.value.newPassword;
      return same ? null : { passwordMatch: { value: control.value } };
    };
  }
}
