import { ChangeDetectionStrategy, Component, Input  } from '@angular/core';
import { ReactiveFormsModule,FormGroup } from '@angular/forms';
import { IAuthForm } from '@stratosui/store';

import { ProductNameComponent } from '../../../../shared/components/product-name.ccomponent';

// SSO form has an empty authValues group - no additional fields required
type SsoAuthFormValues = Record<string, never>;

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
  // TODO: Skipped for migration because:
  //  This input overrides a field from a superclass, while the superclass field
  //  is not migrated.
  @Input() formGroup!: FormGroup<SsoAuthForm>;
}
