import { EntityInfo } from '../../../../../../store/types/api.types';
import { Component, OnInit, Inject, Optional } from '@angular/core';
import { MD_DIALOG_DATA, MdDialogRef } from '@angular/material';

@Component({
  selector: 'app-app-event-detail-dialog-component',
  templateUrl: './app-event-detail-dialog-component.component.html',
  styleUrls: ['./app-event-detail-dialog-component.component.scss']
})
export class AppEventDetailDialogComponentComponent {

  constructor(
    public dialogRef: MdDialogRef<AppEventDetailDialogComponentComponent>,
    @Optional() @Inject(MD_DIALOG_DATA) public data: any) { }

}
