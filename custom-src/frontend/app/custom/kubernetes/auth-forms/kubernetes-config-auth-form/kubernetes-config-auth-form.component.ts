import { EndpointAuthValues, IEndpointAuthComponent } from './../../../../core/extension/extension-types';
import { Component, OnInit, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-kubernetes-config-auth-form',
  templateUrl: './kubernetes-config-auth-form.component.html',
  styleUrls: ['./kubernetes-config-auth-form.component.scss']
})
export class KubernetesConfigAuthFormComponent implements IEndpointAuthComponent {
  @Input() formGroup: FormGroup;

  public getValues(values: EndpointAuthValues): EndpointAuthValues {
    return {};
  }

  public getBody(): string {
    return this.formGroup.value.authValues.kubeconfig;
  }
}
