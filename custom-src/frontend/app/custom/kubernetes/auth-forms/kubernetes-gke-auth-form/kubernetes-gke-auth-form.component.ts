import { EndpointAuthValues, IEndpointAuthComponent } from './../../../../core/extension/extension-types';
import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-kubernetes-gke-auth-form',
  templateUrl: './kubernetes-gke-auth-form.component.html',
  styleUrls: ['./kubernetes-gke-auth-form.component.scss']
})
export class KubernetesGKEAuthFormComponent implements IEndpointAuthComponent {
  @Input() formGroup: FormGroup;

  public getValues(values: EndpointAuthValues): EndpointAuthValues {
    return {};
  }

  public getBody(): string {
    return this.formGroup.value.authValues.gkeconfig;
  }
}
