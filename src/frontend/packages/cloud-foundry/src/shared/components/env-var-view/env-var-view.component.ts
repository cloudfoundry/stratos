import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { MAT_DIALOG_DATA, TailwindDialogRef, CodeBlockComponent } from '@stratosui/core';


@Component({
  selector: 'app-env-var-view',
  templateUrl: './env-var-view.component.html',
  styleUrls: ['./env-var-view.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CodeBlockComponent
  ]
})
export class EnvVarViewComponent {
  data = inject<{
    key: string;
    value: any;
}>(MAT_DIALOG_DATA);
  dialogRef = inject<TailwindDialogRef<EnvVarViewComponent>>('TailwindDialogRef' as any);


  isObject(test: any): boolean {
    return typeof test === 'object';
  }


}
