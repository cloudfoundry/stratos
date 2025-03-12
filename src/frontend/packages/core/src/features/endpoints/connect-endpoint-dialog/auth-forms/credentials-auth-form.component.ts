import { Component, Input } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { IAuthForm } from '@stratosui/store';

@Component({
  selector: 'app-credentials-auth-form',
  templateUrl: './credentials-auth-form.component.html',
  styleUrls: ['./credentials-auth-form.component.scss']
})
export class CredentialsAuthFormComponent implements IAuthForm {

  showPassword = false;

  // Custom labels for the input fields
  pConfig: any = {
    usernameLabel: 'Username',
    passwordLabel: 'Password'
  };

  @Input() formGroup: UntypedFormGroup;

  get config(): any {
    return this.pConfig;
  }

  @Input() set config(v: any) {
    if (v) {
      this.pConfig = v;
    }
  }
}
