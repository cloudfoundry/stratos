import { GetSystemInfo } from '../../../store/actions/system.actions';
import { SystemEffects } from '../../../store/effects/system.effects';
import { systemStoreNames } from '../../../store/types/system.types';
import { cnsisStoreNames, CNSISModel } from '../../../store/types/cnsis.types';
import { ActionState, RequestSectionKeys } from '../../../store/reducers/api-request-reducer/types';
import { CNSISEffect } from '../../../store/effects/cnsis.effects';
import { selectEntity, selectRequestInfo, selectUpdateInfo } from '../../../store/selectors/api.selectors';
import { Observable } from 'rxjs/Rx';
import { FormBuilder, Validators } from '@angular/forms';
import { ConnectCnis, EndpointSchema } from '../../../store/actions/cnsis.actions';
import { Store } from '@ngrx/store';
import { Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { MdDialogRef, MD_DIALOG_DATA } from '@angular/material';
import { AppState } from '../../../store/app-state';
import { FormControl } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'app-connect-endpoint-dialog',
  templateUrl: './connect-endpoint-dialog.component.html',
  styleUrls: ['./connect-endpoint-dialog.component.scss']
})
export class ConnectEndpointDialogComponent implements OnDestroy {
  connecting$: Observable<boolean>;
  connectingError$: Observable<boolean>;
  fetchingInfo$: Observable<boolean>;
  endpointConnected$: Observable<boolean>;
  valid$: Observable<boolean>;
  canSubmit$: Observable<boolean>;

  isBusy$: Observable<boolean>;

  connectingSub: Subscription;
  fetchSub: Subscription;

  constructor(
    public store: Store<AppState>,
    public fb: FormBuilder,
    public dialogRef: MdDialogRef<ConnectEndpointDialogComponent>,
    @Inject(MD_DIALOG_DATA) public data: {
      name: string,
      guid: string
    }
  ) {
    const update$ = this.store.select(
      selectUpdateInfo(
        cnsisStoreNames.type,
        this.data.guid,
        CNSISEffect.connectingKey,
        cnsisStoreNames.section
      )
    ).filter(update => !!update);

    this.fetchingInfo$ = this.store.select(
      selectRequestInfo(
        systemStoreNames.type,
        SystemEffects.guid,
        systemStoreNames.section
      )
    )
      .filter(request => !!request)
      .map(request => request.fetching);

    this.endpointConnected$ = this.store.select(
      selectEntity<CNSISModel>(
        cnsisStoreNames.type,
        this.data.guid,
        cnsisStoreNames.section
      )
    )
      .do(request => {
        console.log(request);
      })
      .map(request => !!(request && request.info && request.info.user));

    this.connecting$ =
      update$
        .map(update => update.busy);
    this.connectingError$ = update$.map(update => update.error);

    this.fetchSub = update$
      .pairwise()
      .subscribe(([oldVal, newVal]) => {
        if (!newVal.error && (oldVal.busy && !newVal.busy)) {
          // Has finished fetching
          this.store.dispatch(new GetSystemInfo());
        }
      });

    this.connectingSub = this.endpointConnected$
      .filter(connected => connected)
      .subscribe(() => {
        this.dialogRef.close();
      });

    this.valid$ = this.endpointForm.valueChanges
      .map(() => this.endpointForm.valid);

    this.isBusy$ = Observable.combineLatest(
      this.connecting$.startWith(false),
      this.fetchingInfo$.startWith(false)
    )
      .map(([connecting, fetchingInfo]) => connecting || fetchingInfo);

    this.canSubmit$ = Observable.combineLatest(
      this.connecting$.startWith(false),
      this.fetchingInfo$.startWith(false),
      this.valid$.startWith(false)
    )
      .map(([connecting, fetchingInfo, valid]) => !connecting && !fetchingInfo && valid);

  }
  public endpointForm = this.fb.group({
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

  ngOnDestroy() {
    this.fetchSub.unsubscribe();
    this.connectingSub.unsubscribe();
  }
}
