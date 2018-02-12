import { GetSystemInfo } from '../../../store/actions/system.actions';
import { SystemEffects } from '../../../store/effects/system.effects';
import { systemStoreNames } from '../../../store/types/system.types';
import { cnsisStoreNames, CNSISModel } from '../../../store/types/cnsis.types';
import { ActionState, RequestSectionKeys } from '../../../store/reducers/api-request-reducer/types';
import { CNSISEffect } from '../../../store/effects/cnsis.effects';
import { selectEntity, selectRequestInfo, selectUpdateInfo } from '../../../store/selectors/api.selectors';
import { Observable } from 'rxjs/Rx';
import { FormBuilder, Validators, FormArray, FormGroup } from '@angular/forms';
import { ConnectCnis, EndpointSchema } from '../../../store/actions/cnsis.actions';
import { Store } from '@ngrx/store';
import { Component, Inject, Input, OnDestroy } from '@angular/core';
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
  public endpointForm;
   
  private authTypes = [
    {
      name: "Username and Password",
      value: "oauth2",
      form: {
        username: ['', Validators.required],
        password: ['', Validators.required],
      },
      types: [ 'cf' ]
    },
    {
      name: "Token",
      value: "bearer",
      form: {
        token: ['', Validators.required],
      },
      types: [ 'k8s' ]
    }
  ];

  private authTypesForEndpoint = [];

  constructor(
    public store: Store<AppState>,
    public fb: FormBuilder,
    public dialogRef: MatDialogRef<ConnectEndpointDialogComponent>,
    public snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: {
      name: string,
      guid: string,
      type: string,
    }
  ) {
    // Populate the valid auth types for the endpoint that we want to connect to
    this.authTypes.forEach(authType => {
      if (authType.types.find(t => t=== this.data.type)) {
        this.authTypesForEndpoint.push(authType);
      }
    })

    // Create the endpoint form
    const autoSelected = (this.authTypesForEndpoint.length > 0) ? this.authTypesForEndpoint[0] : {};
    this.endpointForm = this.fb.group({
      authType: [autoSelected.value || '', Validators.required],
      authValues: this.fb.group(autoSelected.form || {})
    });

    this.setupObservables();
    this.setupSubscriptions();
  }

  authChanged(e) {
    const authType = this.authTypesForEndpoint.find(ep => ep.value === this.endpointForm.value.authType);
    this.endpointForm.removeControl('authValues');
    this.endpointForm.addControl('authValues', this.fb.group(authType.form));
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
      cnsisStoreNames.type,
      this.data.guid,
      CNSISEffect.connectingKey
    );
  }

  private getRequestSelector() {
    return selectRequestInfo(
      cnsisStoreNames.type,
      SystemEffects.guid
    );
  }

  private getEntitySelector() {
    return selectEntity<CNSISModel>(
      cnsisStoreNames.type,
      this.data.guid,
    );
  }

  submit(event) {
    const { guid, authType, authValues } = this.endpointForm.value;

    console.log(this.endpointForm.value);
    this.store.dispatch(new ConnectCnis(
      this.data.guid,
      authType,
      authValues,
    ));
  }

  ngOnDestroy() {
    this.fetchSub.unsubscribe();
    this.connectingSub.unsubscribe();
  }
}
