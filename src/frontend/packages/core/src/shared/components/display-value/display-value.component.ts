import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-display-value',
  templateUrl: './display-value.component.html',
  styleUrls: ['./display-value.component.scss'],
  standalone: true,
  imports: [
    CommonModule
  ]
})
export class DisplayValueComponent {

  @Input() label: string;
  @Input() value: string;

  constructor() { }
}
