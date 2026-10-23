
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { DisplayValueComponent } from '../display-value/display-value.component';

@Component({
  selector: 'app-editable-display-value',
  templateUrl: './editable-display-value.component.html',
  standalone: true,
  imports: [
    DisplayValueComponent
],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditableDisplayValueComponent {

  readonly edit = input<boolean>();
  readonly label = input<string>();
  readonly value = input<any>();

  constructor() { }

}
