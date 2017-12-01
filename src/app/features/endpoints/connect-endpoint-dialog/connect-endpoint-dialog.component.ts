import { FormBuilder, Validators } from '@angular/forms';
import { ConnectCnis } from '../../../store/actions/cnsis.actions';
import { Store } from '@ngrx/store';
import { Component, Inject, Input, OnInit } from '@angular/core';
import { MdDialogRef, MD_DIALOG_DATA } from '@angular/material';
import { AppState } from '../../../store/app-state';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-connect-endpoint-dialog',
  templateUrl: './connect-endpoint-dialog.component.html',
  styleUrls: ['./connect-endpoint-dialog.component.scss']
})
export class ConnectEndpointDialogComponent {

  constructor(
    public store: Store<AppState>,
    public fb: FormBuilder,
    public dialogRef: MdDialogRef<ConnectEndpointDialogComponent>,
    @Inject(MD_DIALOG_DATA) public data: {
      guid: string,
      username: string,
      password: string
    }
  ) {
  }
  public endpointForm = this.fb.group({
    guid: new FormControl({ value: this.data.guid, disabled: true }, Validators.required),
    username: ['', Validators.required],
    password: ['', Validators.required]
  });
  submit(event) {
    const { guid, username, password } = this.endpointForm.value;
    this.store.dispatch(new ConnectCnis(
      this.data.guid,
      username,
      password
    ));
  }
}
