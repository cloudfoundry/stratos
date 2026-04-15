import { Component, Input } from '@angular/core';

@Component({
selector: 'app-stratos-title',
  templateUrl: './stratos-title.component.html',
  standalone: false
})
export class StratosTitleComponent {

  // Optional title
  @Input() title: string;
}
