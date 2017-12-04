import { ActionState, RequestSectionKeys } from '../../../store/reducers/api-request-reducer/types';
import { CNSISEffect } from '../../../store/effects/cnsis.effects';
import { selectUpdateInfo } from '../../../store/selectors/api.selectors';
import { Observable } from 'rxjs/Rx';
import { FormBuilder, Validators } from '@angular/forms';
import { ConnectCnis, EndpointSchema } from '../../../store/actions/cnsis.actions';
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
  busy$: Observable<boolean>;
  error$: Observable<boolean>;
  done$: Observable<ActionState>;

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

    const update$ = this.store.select(
      selectUpdateInfo(
        EndpointSchema.key,
        this.data.guid,
        CNSISEffect.connectingKey,
        RequestSectionKeys.Other
      )
    ).filter(update => !!update);

    this.busy$ = update$.map(update => update.busy);
    this.error$ = update$.map(update => update.error);
    this.done$ = this.busy$
      .filter(busy => busy)
      .distinctUntilChanged()
      .mergeMap(() => update$.filter(update => !update.busy && !update.error))
      .do(() => {
        console.log('done');
      });

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
