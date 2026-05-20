import { ChangeDetectionStrategy, Component, Input} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

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
    let certValue = (values?.cert as string) ?? '';
    let certKeyValue = (values?.certKey as string) ?? '';

    // Base64-encode PEM content; leave already-encoded values as-is
    if (certValue.startsWith('-----BEGIN')) {
      certValue = btoa(certValue);
    }
    if (certKeyValue.startsWith('-----BEGIN')) {
      certKeyValue = btoa(certKeyValue);
    }

    return { cert: certValue, certKey: certKeyValue };
  }

  public getBody(): string {
    return '';
  }
}
