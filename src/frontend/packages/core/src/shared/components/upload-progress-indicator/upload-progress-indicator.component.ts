import { ChangeDetectionStrategy, Component, Input  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomProgressBarSelectorComponent } from '../custom-material/custom-material.component';
import { CustomIconComponent } from '../../../shared/components/custom-material/custom-material.component';

@Component({
  selector: 'app-upload-progress-indicator',
  templateUrl: './upload-progress-indicator.component.html',
  styleUrls: ['./upload-progress-indicator.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    CustomIconComponent,
    CustomProgressBarSelectorComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadProgressIndicatorComponent {

  @Input() value!: number;

}
