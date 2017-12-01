import { Component, Inject, Input, OnInit } from '@angular/core';
import { MdDialogRef, MD_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-connect-endpoint-dialog',
  templateUrl: './connect-endpoint-dialog.component.html',
  styleUrls: ['./connect-endpoint-dialog.component.scss']
})
export class ConnectEndpointDialogComponent implements OnInit {

  constructor(
    public dialogRef: MdDialogRef<ConnectEndpointDialogComponent>,
    @Inject(MD_DIALOG_DATA) public data: {
      guid: string
    }
  ) { }

  ngOnInit() {
  }

}
