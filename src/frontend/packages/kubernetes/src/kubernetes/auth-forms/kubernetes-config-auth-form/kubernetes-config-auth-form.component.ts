import { ChangeDetectionStrategy, Component, Input} from '@angular/core';
import { type FormControl, type FormGroup, ReactiveFormsModule,} from '@angular/forms';

import { FileInputComponent } from '@stratosui/core';
import type { EndpointAuthValues, IEndpointAuthComponent } from '../../../../../store/src/extension-types';

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
    FileInputComponent
  ]
})
export class KubernetesConfigAuthFormComponent implements IEndpointAuthComponent {
  @Input() formGroup: FormGroup<ConfigAuthForm>;

  public getValues(_values: EndpointAuthValues): EndpointAuthValues {
    return {};
  }

  public getBody(): string {
    return this.formGroup.value.kubeconfig ?? '';
  }
}
