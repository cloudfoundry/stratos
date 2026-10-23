import { ChangeDetectionStrategy, Component, Input} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { IAuthForm } from '../../../../../store/src/extension-types';

interface ServiceAccountAuthForm {
  token: FormControl<string>;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-kubernetes-serviceaccount-auth-form',
  templateUrl: './kubernetes-serviceaccount-auth-form.component.html',
  standalone: true,
  imports: [ReactiveFormsModule]
})
export class KubernetesSATokenAuthFormComponent implements IAuthForm {
  // TODO: Skipped for migration because:
  //  This input overrides a field from a superclass, while the superclass field
  //  is not migrated.
  @Input() formGroup!: FormGroup<ServiceAccountAuthForm>; // strict: required @Input (IAuthForm contract), assigned by the auth-form host
}
