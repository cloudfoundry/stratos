import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { EndpointAuthValues, IEndpointAuthComponent } from '../../../../core/extension/extension-types';

@Component({
  selector: 'app-kubernetes-certs-auth-form',
  templateUrl: './kubernetes-certs-auth-form.component.html',
  styleUrls: ['./kubernetes-certs-auth-form.component.scss']
})
export class KubernetesCertsAuthFormComponent implements IEndpointAuthComponent {
  @Input() formGroup: FormGroup;


  public getValues(values: EndpointAuthValues): EndpointAuthValues {
    return {};
  }

  public getBody(): string {
    /** Body content is in the following encoding:
     * base64encoded:base64encoded
     */
    const certBase64 = btoa(this.formGroup.value.authValues.cert);
    const certKeyBase64 = btoa(this.formGroup.value.authValues.certKey);
    return `${certBase64}:${certKeyBase64}`;
  }
}
