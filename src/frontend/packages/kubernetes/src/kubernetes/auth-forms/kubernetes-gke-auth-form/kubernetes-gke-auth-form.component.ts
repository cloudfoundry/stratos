import { Component, Input } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';

import { EndpointAuthValues, IEndpointAuthComponent } from '../../../../../store/src/extension-types';



@Component({
  selector: 'app-kubernetes-gke-auth-form',
  templateUrl: './kubernetes-gke-auth-form.component.html',
  styleUrls: ['./kubernetes-gke-auth-form.component.scss']
})
export class KubernetesGKEAuthFormComponent implements IEndpointAuthComponent {
  @Input() formGroup: UntypedFormGroup;

  public getValues(values: EndpointAuthValues): EndpointAuthValues {
    return {};
  }

  public getBody(): string {
    return this.formGroup.value.authValues.gkeconfig;
  }
}
