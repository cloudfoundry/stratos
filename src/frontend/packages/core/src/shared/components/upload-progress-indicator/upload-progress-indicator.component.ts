import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { CustomProgressBarSelectorComponent } from '../custom-material/custom-material.component';

@Component({
  selector: 'app-upload-progress-indicator',
  templateUrl: './upload-progress-indicator.component.html',
  styleUrls: ['./upload-progress-indicator.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    CustomProgressBarSelectorComponent
  ]
})
export class UploadProgressIndicatorComponent {

  constructor() { }

  @Input() value: number;

}
