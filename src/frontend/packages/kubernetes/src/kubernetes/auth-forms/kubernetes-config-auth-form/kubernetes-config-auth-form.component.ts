import { Component, Input } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';

import { EndpointAuthValues, IEndpointAuthComponent } from '../../../../../store/src/extension-types';



@Component({
  selector: 'app-kubernetes-config-auth-form',
  templateUrl: './kubernetes-config-auth-form.component.html',
  styleUrls: ['./kubernetes-config-auth-form.component.scss']
})
export class KubernetesConfigAuthFormComponent implements IEndpointAuthComponent {
  @Input() formGroup: UntypedFormGroup;

  public getValues(values: EndpointAuthValues): EndpointAuthValues {
    return {};
  }

  public getBody(): string {
    return this.formGroup.value.authValues.kubeconfig;
  }
}
