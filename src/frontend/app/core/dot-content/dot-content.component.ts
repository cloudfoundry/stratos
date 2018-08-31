import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-dot-content',
  templateUrl: './dot-content.component.html',
  styleUrls: ['./dot-content.component.scss']
})
export class DotContentComponent {
  @Input() disabled: boolean;
}
