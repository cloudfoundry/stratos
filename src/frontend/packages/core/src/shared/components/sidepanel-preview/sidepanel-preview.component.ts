import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-sidepanel-preview',
  templateUrl: './sidepanel-preview.component.html',
  styleUrls: ['./sidepanel-preview.component.scss']
})
export class SidepanelPreviewComponent {

  @Input()
  title: string;

  constructor() { }
}
