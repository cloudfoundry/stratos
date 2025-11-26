import { CommonModule, JsonPipe } from '@angular/common';
import { Component, Inject , ChangeDetectionStrategy } from '@angular/core';
import { MAT_DIALOG_DATA, type TailwindDialogRef, CodeBlockComponent } from '@stratosui/core';


@Component({
  selector: 'app-env-var-view',
  templateUrl: './env-var-view.component.html',
  styleUrls: ['./env-var-view.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    JsonPipe,
    CodeBlockComponent
  ]
})
export class EnvVarViewComponent {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      key: string,
      value: unknown
    },
    @Inject('TailwindDialogRef') public dialogRef: TailwindDialogRef<EnvVarViewComponent>
  ) { }

  isObject(test: unknown): boolean {
    return typeof test === 'object';
  }


}
