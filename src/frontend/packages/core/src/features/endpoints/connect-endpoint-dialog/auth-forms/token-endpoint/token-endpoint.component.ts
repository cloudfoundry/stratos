import { Component, Input } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';

import { IAuthForm } from '../../../../../../../store/src/extension-types';

@Component({
  selector: 'app-token-endpoint',
  templateUrl: './token-endpoint.component.html',
  styleUrls: ['./token-endpoint.component.scss']
})
export class TokenEndpointComponent implements IAuthForm {
  public showToken = false;

  @Input() formGroup: UntypedFormGroup;

  @Input() config: any = {};
}
