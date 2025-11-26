import { ChangeDetectionStrategy, Component, Input  } from '@angular/core';
import { ReactiveFormsModule,type FormGroup } from '@angular/forms';
import type { IAuthForm } from '@stratosui/store';

import { ProductNameComponent } from '../../../../shared/components/product-name.component';

type SsoAuthFormValues = {}

interface SsoAuthForm {
  authValues: FormGroup<SsoAuthFormValues>;
}

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
  @Input() formGroup!: FormGroup<SsoAuthForm>;
}
