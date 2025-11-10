import { CommonModule } from '@angular/common';
import { Component, Inject , ChangeDetectionStrategy } from '@angular/core';
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

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      key: string,
      value: any
    },
    @Inject('TailwindDialogRef') public dialogRef: TailwindDialogRef<EnvVarViewComponent>
  ) { }

  isObject(test: any): boolean {
    return typeof test === 'object';
  }


}
