import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, TailwindDialogRef } from '@stratosui/core';
import { CodeBlockComponent } from '../../../../../core/src/shared/components/code-block/code-block.component';


@Component({
  selector: 'app-env-var-view',
  templateUrl: './env-var-view.component.html',
  styleUrls: ['./env-var-view.component.scss'],
  standalone: true,
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
