import { ChangeDetectionStrategy, Component, Input} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, UntypedFormGroup } from '@angular/forms';

import { FileInputComponent } from '../../../../../core/src/shared/components/file-input/file-input.component';
import { CustomTabGroupComponent, CustomTabComponent } from '../../../../../core/src/shared/components/custom-tabs/custom-tabs.component';
import { EndpointAuthValues, IEndpointAuthComponent } from '../../../../../store/src/extension-types';

interface CertsAuthForm {
  cert: FormControl<string>;
  certKey: FormControl<string>;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-kubernetes-certs-auth-form',
  templateUrl: './kubernetes-certs-auth-form.component.html',
  styleUrls: ['./kubernetes-certs-auth-form.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CustomTabGroupComponent,
    CustomTabComponent,
    FileInputComponent,
  ]
})
export class KubernetesCertsAuthFormComponent implements IEndpointAuthComponent {
  @Input() formGroup: FormGroup<CertsAuthForm>;


  public getValues(values: EndpointAuthValues): EndpointAuthValues {
    return {};
  }

  public getBody(): string {
    /** Body content is in the following encoding:
     * base64encoded:base64encoded
     */

    let certBase64 = this.formGroup.value.cert;
    let certKeyBase64 = this.formGroup.value.certKey;

    // May already be base64 encoded
    if (certBase64.indexOf('-----BEGIN') === 0) {
      certBase64 = btoa(this.formGroup.value.cert);
    }

    if (certKeyBase64.indexOf('-----BEGIN') === 0) {
      certKeyBase64 = btoa(this.formGroup.value.certKey);
    }
    return `${certBase64}:${certKeyBase64}`;
  }
}
