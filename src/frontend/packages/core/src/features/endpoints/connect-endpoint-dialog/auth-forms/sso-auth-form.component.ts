import { ChangeDetectionStrategy, Component, Input  } from '@angular/core';
import { ReactiveFormsModule, UntypedFormGroup } from '@angular/forms';
import { IAuthForm } from '@stratosui/store';

import { ProductNameComponent } from '../../../../shared/components/product-name.ccomponent';

@Component({
  selector: 'app-sso-auth-form',
  templateUrl: './sso-auth-form.component.html',
  styleUrls: ['./sso-auth-form.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ProductNameComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SSOAuthFormComponent implements IAuthForm {
  @Input() formGroup: UntypedFormGroup;
}
