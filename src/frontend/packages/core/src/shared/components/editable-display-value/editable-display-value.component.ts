import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-editable-display-value',
  templateUrl: './editable-display-value.component.html',
  styleUrls: ['./editable-display-value.component.scss']
})
export class EditableDisplayValueComponent {

  @Input() edit: boolean;
  @Input() label: string;
  @Input() value: any;

  constructor() { }

}
