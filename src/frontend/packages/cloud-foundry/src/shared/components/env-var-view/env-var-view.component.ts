import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';


@Component({
  selector: 'app-env-var-view',
  templateUrl: './env-var-view.component.html',
  styleUrls: ['./env-var-view.component.scss']
})
export class EnvVarViewComponent {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      key: string,
      value: any
    }
  ) { }

  isObject(test: any): boolean {
    return typeof test === 'object';
  }


}
