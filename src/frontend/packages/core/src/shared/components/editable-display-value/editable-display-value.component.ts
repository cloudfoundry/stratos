
import { Component, Input } from '@angular/core';

import { DisplayValueComponent } from '../display-value/display-value.component';

@Component({
  selector: 'app-editable-display-value',
  templateUrl: './editable-display-value.component.html',
  styleUrls: ['./editable-display-value.component.scss'],
  standalone: true,
  imports: [
    DisplayValueComponent
]
})
export class EditableDisplayValueComponent {

  @Input() edit: boolean;
  @Input() label: string;
  @Input() value: any;

  constructor() { }

}
