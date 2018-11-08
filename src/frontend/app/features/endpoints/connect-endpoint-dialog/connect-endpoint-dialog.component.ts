import { Component, Inject, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatSnackBar } from '@angular/material';
import { Store } from '@ngrx/store';
import { combineLatest as observableCombineLatest, Observable, of as observableOf, Subscription } from 'rxjs';
import { delay, filter, map, pairwise, startWith, switchMap } from 'rxjs/operators';

import { ConnectEndpoint } from '../../../store/actions/endpoint.actions';
import { ShowSnackBar } from '../../../store/actions/snackBar.actions';
import { GetSystemInfo } from '../../../store/actions/system.actions';
import { AppState } from '../../../store/app-state';
import { EndpointsEffect } from '../../../store/effects/endpoint.effects';
import { SystemEffects } from '../../../store/effects/system.effects';
import { ActionState } from '../../../store/reducers/api-request-reducer/types';
import { selectEntity, selectRequestInfo, selectUpdateInfo } from '../../../store/selectors/api.selectors';
import { EndpointModel, endpointStoreNames, EndpointType } from '../../../store/types/endpoint.types';
import { getCanShareTokenForEndpointType, getEndpointAuthTypes } from '../endpoint-helpers';


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
  public endpointForm: FormGroup;

  private bodyContent = '';

  private hasAttemptedConnect: boolean;
  public authTypesForEndpoint = [];
  public upload = true;
  private kubeconfig = '';
  private cert = '';
  private certKey = '';
  public canShareEndpointToken = false;
  private cachedAuthTypeFormFields: string[] = [];

  // We need a delay to ensure the BE has finished registering the endpoint.
  // If we don't do this and if we're quick enough, we can navigate to the application page
  // and end up with an empty list where we should have results.
  public connectDelay = 1000;

  constructor(
    public store: Store<AppState>,
    public fb: FormBuilder,
    public dialogRef: MatDialogRef<ConnectEndpointDialogComponent>,
    public snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: {
      name: string,
      guid: string,
      type: EndpointType,
      ssoAllowed: boolean,
    }
  ) {
    // Populate the valid auth types for the endpoint that we want to connect to
    getEndpointAuthTypes().forEach(authType => {
      if (authType.types.find(t => t === this.data.type)) {
        this.authTypesForEndpoint.push(authType);
      }
    });

    // Remove SSO if not allowed on this endpoint
    this.authTypesForEndpoint = this.authTypesForEndpoint.filter(authType => authType.value !== 'sso' || data.ssoAllowed);

    // Not all endpoint types might allow token sharing - typically types like metrics do
    this.canShareEndpointToken = getCanShareTokenForEndpointType(data.type);

    // Create the endpoint form
    let autoSelected = (this.authTypesForEndpoint.length > 0) ? this.authTypesForEndpoint[0] : {};
    this.cachedAuthTypeFormFields = Object.keys(autoSelected.form || {});

    // Auto-select SSO if it is available
    const ssoIndex = this.authTypesForEndpoint.findIndex(authType => authType.value === 'sso' && data.ssoAllowed);
    if (ssoIndex >= 0) {
      autoSelected = this.authTypesForEndpoint[ssoIndex];
    }

    this.endpointForm = this.fb.group({
      authType: [autoSelected.value || '', Validators.required],
      authValues: this.fb.group(autoSelected.form || {}),
      systemShared: false
    });

    this.setupObservables();
    this.setupSubscriptions();
  }

  authChanged() {
    const authType = this.authTypesForEndpoint.find(ep => ep.value === this.endpointForm.value.authType);
    const authTypeFormFields = Object.keys(authType.form);
    if (!this.sameAuthTypeFormFields(this.cachedAuthTypeFormFields, authTypeFormFields)) {
      // Don't remove and re-add the same control, this helps with form validation
      this.cachedAuthTypeFormFields = authTypeFormFields;
      this.endpointForm.removeControl('authValues');
      this.endpointForm.addControl('authValues', this.fb.group(authType.form));
    }
    this.bodyContent = '';
  }

  private sameAuthTypeFormFields(a: string[], b: string[]): boolean {
    return a.length === b.length && a.filter(item => b.indexOf(item) < 0).length === 0;
  }

  setupSubscriptions() {
    this.fetchSub = this.update$.pipe(
      pairwise())
      .subscribe(([oldVal, newVal]) => {
        if (!newVal.error && (oldVal.busy && !newVal.busy)) {
          // Has finished fetching
          this.store.dispatch(new GetSystemInfo());
        }
      });

    this.connectingSub = this.endpointConnected$.pipe(
      filter(connected => connected),
      delay(this.connectDelay))
      .subscribe(() => {
        this.store.dispatch(new ShowSnackBar(`Connected endpoint '${this.data.name}'`));
        this.dialogRef.close();
      });
  }

  dealWithFile($event, fileName: string) {
    const file = $event;
    const reader = new FileReader();
    reader.onload = () => {
      this.updateFileState(fileName, reader.result);
    };
    reader.onerror = () => {
      // Clear the form and thus make it invalid on error
      this.updateFileState(fileName, null);
    };
    reader.readAsText(file);
  }

  private updateFileState(fileName: string, value: string | ArrayBuffer) {
    this[fileName] = value;
    const authValues: FormGroup = this.endpointForm.controls.authValues as FormGroup;
    authValues.controls[fileName].setValue(value);
  }

  setupObservables() {
    this.update$ = this.store.select(
      this.getUpdateSelector()
    ).pipe(filter(update => !!update));

    this.fetchingInfo$ = this.store.select(
      this.getRequestSelector()
    ).pipe(
      filter(request => !!request),
      map(request => request.fetching));

    this.endpointConnected$ = this.store.select(
      this.getEntitySelector()
    ).pipe(
      map(request => !!(request && request.api_endpoint && request.user)));
    const busy$ = this.update$.pipe(map(update => update.busy), startWith(false));
    this.connecting$ = busy$.pipe(
      pairwise(),
      switchMap(([oldBusy, newBusy]) => {
        if (oldBusy === true && newBusy === false) {
          return busy$.pipe(
            delay(this.connectDelay),
            startWith(true)
          );
        }
        return observableOf(newBusy);
      })
    );
    this.connectingError$ = this.update$.pipe(
      filter(() => this.hasAttemptedConnect),
      map(update => update.error)
    );

    this.valid$ = this.endpointForm.valueChanges.pipe(map(() => this.endpointForm.valid));

    this.setupCombinedObservables();
  }

  setupCombinedObservables() {
    this.isBusy$ = observableCombineLatest(
      this.connecting$.pipe(startWith(false)),
      this.fetchingInfo$.pipe(startWith(false))
    ).pipe(
      map(([connecting, fetchingInfo]) => connecting || fetchingInfo));

    this.canSubmit$ = observableCombineLatest(
      this.connecting$.pipe(startWith(false)),
      this.fetchingInfo$.pipe(startWith(false)),
      this.valid$.pipe(startWith(this.endpointForm.valid))
    ).pipe(
      map(([connecting, fetchingInfo, valid]) => !connecting && !fetchingInfo && valid)
    );
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

  toggleAccept() {
    this.upload = !this.upload;
  }

  submit() {
    this.hasAttemptedConnect = true;
    const { authType, authValues, systemShared } = this.endpointForm.value;
    const authVal = authValues;
    if (this.endpointForm.value.authType === 'kubeconfig' || this.endpointForm.value.authType === 'kubeconfig-az') {
      this.bodyContent = this.kubeconfig;
    }
    if (this.endpointForm.value.authType === 'kube-cert-auth') {
      /** Body content is in the following encoding:
       * base64encoded:base64encoded
       */
      const certBase64 = btoa(this.cert);
      const certKeyBase64 = btoa(this.certKey);
      this.bodyContent = `${certBase64}:${certKeyBase64}`;
    }

    this.store.dispatch(new ConnectEndpoint(
      this.data.guid,
      this.data.type,
      authType,
      authVal,
      systemShared,
      this.bodyContent,
    ));
  }

  ngOnDestroy() {
    this.fetchSub.unsubscribe();
    this.connectingSub.unsubscribe();
  }
}
