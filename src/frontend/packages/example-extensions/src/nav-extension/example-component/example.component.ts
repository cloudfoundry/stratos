import { Component } from '@angular/core';
import { PageHeaderComponent } from '@stratosui/core';

@Component({
selector: 'app-example',
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.scss'],
  standalone: true,
  imports: [
    PageHeaderComponent
  ]
})
export class ExampleComponent {}

