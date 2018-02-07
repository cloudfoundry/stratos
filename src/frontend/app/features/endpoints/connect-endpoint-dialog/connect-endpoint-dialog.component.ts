import { GetSystemInfo } from '../../../store/actions/system.actions';
import { SystemEffects } from '../../../store/effects/system.effects';
import { systemStoreNames } from '../../../store/types/system.types';
import { endpointStoreNames, EndpointModel } from '../../../store/types/endpoint.types';
import { ActionState, RequestSectionKeys } from '../../../store/reducers/api-request-reducer/types';
import { EndpointsEffect } from '../../../store/effects/endpoint.effects';
import { selectEntity, selectRequestInfo, selectUpdateInfo } from '../../../store/selectors/api.selectors';
import { Observable } from 'rxjs/Rx';
import { FormBuilder, Validators } from '@angular/forms';
import { ConnectEndpoint, EndpointSchema } from '../../../store/actions/endpoint.actions';
import { Store } from '@ngrx/store';
import { Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatSnackBar } from '@angular/material';
import { AppState } from '../../../store/app-state';
import { FormControl } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';
import { ShowSnackBar } from '../../../store/actions/snackBar.actions';

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

  private update$: Observable<ActionState>;

  isBusy$: Observable<boolean>;

  connectingSub: Subscription;
  fetchSub: Subscription;
  public endpointForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });


  constructor(
    public store: Store<AppState>,
    public fb: FormBuilder,
    public dialogRef: MatDialogRef<ConnectEndpointDialogComponent>,
    public snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: {
      name: string,
      guid: string
    }
  ) {
    this.setupObservables();
    this.setupSubscriptions();
  }

  setupSubscriptions() {
    this.fetchSub = this.update$
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
        this.store.dispatch(new ShowSnackBar(`Connected ${this.data.name}`));
        this.dialogRef.close();
      });
  }

  setupObservables() {
    this.update$ = this.store.select(
      this.getUpdateSelector()
    ).filter(update => !!update);

    this.fetchingInfo$ = this.store.select(
      this.getRequestSelector()
    )
      .filter(request => !!request)
      .map(request => request.fetching);

    this.endpointConnected$ = this.store.select(
      this.getEntitySelector()
    )
      .map(request => !!(request && request.api_endpoint && request.user));

    this.connecting$ =
      this.update$
        .map(update => update.busy);
    this.connectingError$ = this.update$.map(update => update.error);

    this.valid$ = this.endpointForm.valueChanges
      .map(() => this.endpointForm.valid);

    this.setupCombinedObservables();
  }

  setupCombinedObservables() {
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

  private getUpdateSelector() {
    return selectUpdateInfo(
      endpointStoreNames.type,
      this.data.guid,
      EndpointsEffect.connectingKey
    );
  }

  private getRequestSelector() {
    return selectRequestInfo(
      endpointStoreNames.type,
      SystemEffects.guid
    );
  }

  private getEntitySelector() {
    return selectEntity<EndpointModel>(
      endpointStoreNames.type,
      this.data.guid,
    );
  }

  submit(event) {
    const { guid, username, password } = this.endpointForm.value;
    this.store.dispatch(new ConnectEndpoint(
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
