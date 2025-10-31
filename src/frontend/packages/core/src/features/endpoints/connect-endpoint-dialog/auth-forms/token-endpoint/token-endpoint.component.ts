import { ChangeDetectionStrategy, Component, Input  } from '@angular/core';
import { ReactiveFormsModule, UntypedFormGroup } from '@angular/forms';
import { CustomFormFieldComponent } from '../../../../../shared/components/custom-form-field/custom-form-field.component';

import { IAuthForm } from '../../../../../../../store/src/extension-types';
import { CustomIconComponent } from '../../../../../shared/components/custom-material/custom-material.component';

@Component({
  selector: 'app-token-endpoint',
  templateUrl: './token-endpoint.component.html',
  styleUrls: ['./token-endpoint.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CustomFormFieldComponent,
    CustomIconComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TokenEndpointComponent implements IAuthForm {
  public showToken = false;

  @Input() formGroup: UntypedFormGroup;

  @Input() config: any = {};
}
