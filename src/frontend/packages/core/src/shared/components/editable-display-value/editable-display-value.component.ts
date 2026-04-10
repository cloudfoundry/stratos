
import { ChangeDetectionStrategy, Component, Input  } from '@angular/core';

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

  @Input() edit!: boolean;
  @Input() label!: string;
  @Input() value: any;

  constructor() { }

}
