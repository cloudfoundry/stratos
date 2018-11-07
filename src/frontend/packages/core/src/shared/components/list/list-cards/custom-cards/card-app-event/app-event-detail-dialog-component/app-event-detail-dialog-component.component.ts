
import { Component, Inject, Optional } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

@Component({
  selector: 'app-app-event-detail-dialog-component',
  templateUrl: './app-event-detail-dialog-component.component.html',
  styleUrls: ['./app-event-detail-dialog-component.component.scss']
})
export class AppEventDetailDialogComponentComponent {

  constructor(
    public dialogRef: MatDialogRef<AppEventDetailDialogComponentComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any) { }

}
