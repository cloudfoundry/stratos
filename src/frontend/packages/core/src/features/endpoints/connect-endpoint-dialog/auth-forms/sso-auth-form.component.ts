import { ChangeDetectionStrategy, Component, Input  } from '@angular/core';
import { ReactiveFormsModule,FormGroup } from '@angular/forms';
import { IAuthForm } from '@stratosui/store';

import { ProductNameComponent } from '../../../../shared/components/product-name.ccomponent';

interface SsoAuthFormValues {
  // SSO form has an empty authValues group - no additional fields required
}

interface SsoAuthForm {
  authValues: FormGroup<SsoAuthFormValues>;
}

@Component({
  selector: 'app-sso-auth-form',
  templateUrl: './sso-auth-form.component.html',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ProductNameComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SSOAuthFormComponent implements IAuthForm {
  @Input() formGroup!: FormGroup<SsoAuthForm>;
}
