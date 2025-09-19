import { Component, Input } from '@angular/core';

@Component({
selector: 'app-upload-progress-indicator',
  templateUrl: './upload-progress-indicator.component.html',
  styleUrls: ['./upload-progress-indicator.component.scss'],
  standalone: false
})
export class UploadProgressIndicatorComponent {

  constructor() { }

  @Input() value: number;

}
