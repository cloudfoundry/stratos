import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-display-value',
  templateUrl: './display-value.component.html',
  styleUrls: ['./display-value.component.scss']
})
export class DisplayValueComponent {

  @Input() label: string;
  @Input() value: string;

  constructor() { }
}
