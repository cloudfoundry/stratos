import { ChangeDetectionStrategy, Component, Input  } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { AppInputDirective, CustomFormFieldComponent } from '../../../../../shared/components/custom-form-field/custom-form-field.component';

import { IAuthForm } from '@stratosui/store';
import { CustomIconComponent } from '../../../../../shared/components/custom-material/custom-material.component';

interface TokenAuthForm {
  token: FormControl<string>;
}

@Component({
  selector: 'app-token-endpoint',
  templateUrl: './token-endpoint.component.html',
  styleUrls: ['./token-endpoint.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AppInputDirective,
    CustomFormFieldComponent,
    CustomIconComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TokenEndpointComponent implements IAuthForm {
  public showToken = false;

  // TODO: Skipped for migration because:
  //  This input overrides a field from a superclass, while the superclass field
  //  is not migrated.
  @Input() formGroup!: FormGroup<TokenAuthForm>;

  // TODO: Skipped for migration because:
  //  This input is used in a control flow expression (e.g. `@if` or `*ngIf`)
  //  and migrating would break narrowing currently.
  @Input() config: any = {};
}
