import { ChangeDetectionStrategy, Component, OnDestroy, OnInit  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, ReactiveFormsModule, FormBuilder, FormGroup, FormControl, ValidatorFn, Validators } from '@angular/forms';
import { CustomFormFieldComponent } from '../../../shared/components/custom-form-field/custom-form-field.component';
import { RouterModule } from '@angular/router';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '../../../shared/services/tailwind-material-replacements';
import { UserProfileInfo, UserProfileInfoUpdates } from '@stratosui/store';
import { Subscription } from 'rxjs';
import { delay, first, map, take, tap } from 'rxjs/operators';

import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { StratosCurrentUserPermissions } from '../../../core/permissions/stratos-user-permissions.checker';
import { UserProfileService } from '../../../core/user-profile.service';
import { ShowHideButtonComponent } from '../../../core/show-hide-button/show-hide-button.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StepComponent, StepOnNextFunction } from '../../../shared/components/stepper/step/step.component';
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
  styleUrls: ['./edit-profile-info.component.scss'],
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

  editProfileForm: FormGroup<EditProfileForm>;
  showPassword: boolean[] = [];

  needsPasswordForEmailChange: boolean;

  constructor(
    private userProfileService: UserProfileService,
    private fb: FormBuilder,
    private currentUserPermissionsService: CurrentUserPermissionsService,
  ) {
    this.editProfileForm = this.fb.group<EditProfileForm>({
      givenName: new FormControl('', { nonNullable: true }),
      familyName: new FormControl('', { nonNullable: true }),
      emailAddress: new FormControl('', { nonNullable: true }),
      currentPassword: new FormControl('', { nonNullable: true }),
      newPassword: new FormControl('', { nonNullable: true }),
      confirmPassword: new FormControl('', { nonNullable: true }),
    });

    this.needsPasswordForEmailChange = false;
  }

  private sub: Subscription;

  private profile: UserProfileInfo;

  private lastRequired = false;
  private lastHavePassword = false;

  private emailAddress: string;

  // Only allow password change if user has the 'password.write' group
  public canChangePassword = this.currentUserPermissionsService.can(StratosCurrentUserPermissions.PASSWORD_CHANGE);

  public passwordRequired = false;

  ngOnInit() {
    this.userProfileService.userProfile$.pipe(first()).subscribe(profile => {
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
        confirmPassword: '',
      });
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
        (values.emailAddress !== this.emailAddress || !!values.newPassword.length) : !!values.newPassword.length;
      this.passwordRequired = required;
      if (required !== this.lastRequired) {
        this.lastRequired = required;
        const validators = required ? [Validators.required] : [];
        this.editProfileForm.get('currentPassword')?.setValidators(validators);
        this.editProfileForm.get('currentPassword')?.updateValueAndValidity();
      }
      const havePassword = !!values.newPassword.length;
      if (havePassword !== this.lastHavePassword) {
        this.lastHavePassword = havePassword;
        const confirmValidator = havePassword ? [Validators.required, this.confirmPasswordValidator()] : [];
        this.editProfileForm.get('confirmPassword')?.setValidators(confirmValidator);
        this.editProfileForm.get('confirmPassword')?.updateValueAndValidity();
      }
    });
  }

  confirmPasswordValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any, } => {
      const same = control.value === this.editProfileForm.value.newPassword;
      return same ? null : { passwordMatch: { value: control.value } };
    };
  }

  // Declared this way to ensure bound to this correctly
  updateProfile: StepOnNextFunction = () => {
    const updates: UserProfileInfoUpdates = {};
    // We will only send the values that were actually edited
    for (const key of Object.keys(this.editProfileForm.value)) {
      const control = this.editProfileForm.get(key);
      if (control && !control.pristine) {
        (updates as any)[key] = this.editProfileForm.value[key as keyof EditProfileForm];
      }
    }
    return this.userProfileService.updateProfile(this.profile, updates).pipe(
      take(1),
      map(([profileResult, passwordResult]) => {
        const okay = !profileResult.error && !passwordResult.error;
        const message = `${profileResult.message || ''}${passwordResult.message || ''}`;
        return {
          success: okay,
          redirect: okay,
          message: okay ? '' : `An error occurred whilst updating your profile: ${message}`
        };
      }),
      delay(300), // Ensure that the profile is updated before fetching to refresh local copy
      tap(() => this.userProfileService.fetchUserProfile())
    );
  };
}
