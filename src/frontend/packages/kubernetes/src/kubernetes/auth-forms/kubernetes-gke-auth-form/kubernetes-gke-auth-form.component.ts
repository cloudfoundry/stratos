import { ChangeDetectionStrategy, Component, Input} from '@angular/core';
import { ReactiveFormsModule, UntypedFormGroup } from '@angular/forms';

import { FileInputComponent } from '../../../../../core/src/shared/components/file-input/file-input.component';
import { EndpointAuthValues, IEndpointAuthComponent } from '../../../../../store/src/extension-types';

interface GKEAuthForm {
  gkeconfig: FormControl<string>;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-kubernetes-gke-auth-form',
  templateUrl: './kubernetes-gke-auth-form.component.html',
  styleUrls: ['./kubernetes-gke-auth-form.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FileInputComponent,
  ]
})
export class KubernetesGKEAuthFormComponent implements IEndpointAuthComponent {
  @Input() formGroup: FormGroup<GKEAuthForm>;

  public getValues(values: EndpointAuthValues): EndpointAuthValues {
    return {};
  }

  public getBody(): string {
    return this.formGroup.value.authValues.gkeconfig;
  }
}
