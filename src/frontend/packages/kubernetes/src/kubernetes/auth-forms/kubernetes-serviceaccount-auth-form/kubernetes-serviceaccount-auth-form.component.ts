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
  @Input() formGroup: FormGroup<ServiceAccountAuthForm>;
}
