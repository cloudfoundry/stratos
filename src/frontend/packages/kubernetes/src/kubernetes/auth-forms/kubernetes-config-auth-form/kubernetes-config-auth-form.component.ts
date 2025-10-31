import { ChangeDetectionStrategy, Component, Input} from '@angular/core';
import { ReactiveFormsModule, UntypedFormGroup } from '@angular/forms';

import { FileInputComponent } from '../../../../../core/src/shared/components/file-input/file-input.component';
import { EndpointAuthValues, IEndpointAuthComponent } from '../../../../../store/src/extension-types';

interface ConfigAuthForm {
  kubeconfig: FormControl<string>;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-kubernetes-config-auth-form',
  templateUrl: './kubernetes-config-auth-form.component.html',
  styleUrls: ['./kubernetes-config-auth-form.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FileInputComponent,
  ]
})
export class KubernetesConfigAuthFormComponent implements IEndpointAuthComponent {
  @Input() formGroup: TypedFormGroup<ConfigAuthForm>;

  public getValues(values: EndpointAuthValues): EndpointAuthValues {
    return {};
  }

  public getBody(): string {
    return this.formGroup.value.authValues.kubeconfig;
  }
}
