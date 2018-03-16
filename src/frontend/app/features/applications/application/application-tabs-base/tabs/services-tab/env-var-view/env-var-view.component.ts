import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';


@Component({
  selector: 'app-env-var-view',
  templateUrl: './env-var-view.component.html',
  styleUrls: ['./env-var-view.component.scss']
})
export class EnvVarViewComponent implements OnInit {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      key: string,
      value: any
    }
  ) {
  }

  ngOnInit() {
  }
  isObject(test: any): boolean {
    return typeof test === 'object';
  }


}
