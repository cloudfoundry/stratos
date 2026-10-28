import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, afterNextRender, computed, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot, Params } from '@angular/router';
import { firstValueFrom, of, Subscription } from 'rxjs';

import { EndpointsDataService, getFullEndpointApiUrl } from '@stratosui/store';

import { SignalStepHandle, StepComponent } from '../../../shared/components/stepper/step/step.component';
import { SteppersComponent } from '../../../shared/components/stepper/steppers/steppers.component';
import { MAT_DIALOG_DATA, TailwindDialogConfig, TailwindDialogRef } from '../../../shared/services/tailwind-dialog.service';
import { TailwindSnackBarService } from '../../../shared/services/tailwind-snackbar.service';
import { ConnectEndpointConfig } from '../connect.service';
import { CreateEndpointCfStep1Component } from '../create-endpoint/create-endpoint-cf-step-1/create-endpoint-cf-step-1.component';
import { CreateEndpointConnectComponent } from '../create-endpoint/create-endpoint-connect/create-endpoint-connect.component';

/** Shared open() options for the connect dialog — every call site spreads
 *  this (adding its own `data`) so the dialog looks and behaves the same
 *  everywhere. Modeless + draggable so the endpoint card behind stays
 *  visible while connecting (its status pill reads "Connecting") and the
 *  panel can be dragged off the card. */
export const CONNECT_ENDPOINT_DIALOG_OPTIONS: TailwindDialogConfig = {
  disableClose: true,
  // As wide as the Register Endpoint dialog: both show the same stepper.
  width: '64rem',
  maxWidth: 'calc(100vw - 2rem)',
  panelClass: ['p-6'],
  modeless: true,
};

// The register step reads the endpoint type from the route, and the stepper
// its query parameters. The dialog is not a route, so it stands one in, as
// the Register Endpoint dialog does.
function dialogRoute(data: ConnectEndpointConfig): ActivatedRoute {
  const params: Params = { type: data.type, subtype: data.subType };
  const queryParams = {};
  return {
    snapshot: {
      params,
      paramMap: { get: (key: string) => params[key] },
      queryParams,
    } as unknown as ActivatedRouteSnapshot,
    params: of(params),
    paramMap: of({ get: (key: string) => params[key] }),
    queryParams: of(queryParams),
  } as unknown as ActivatedRoute;
}

/**
 * Connect (and Reconnect) on an endpoint: the Register/Connect stepper,
 * opened on Connect with Register shown done. Previous reviews the
 * registration; it never undoes it.
 */
@Component({
  selector: 'app-connect-endpoint-dialog',
  templateUrl: './connect-endpoint-dialog.component.html',
  styleUrls: ['./connect-endpoint-dialog.component.scss'],
  standalone: true,
  imports: [
    SteppersComponent,
    StepComponent,
    CreateEndpointCfStep1Component,
    CreateEndpointConnectComponent,
  ],
  providers: [
    { provide: ActivatedRoute, useFactory: () => dialogRoute(inject<ConnectEndpointConfig>(MAT_DIALOG_DATA)) },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConnectEndpointDialogComponent implements OnDestroy {
  dialogRef = inject<TailwindDialogRef<ConnectEndpointDialogComponent>>(TailwindDialogRef);
  data = inject<ConnectEndpointConfig>(MAT_DIALOG_DATA);
  private snackBarService = inject(TailwindSnackBarService);
  private endpointsData = inject(EndpointsDataService);

  // Per endpoint: the dialog is modeless, so two may be open at once
  readonly titleId = `connect-endpoint-dialog-title-${this.data.guid}`;

  readonly endpoint = computed(() => this.endpointsData.endpoints().get(this.data.guid) ?? null);
  readonly address = computed(() => {
    const ep = this.endpoint();
    return ep ? getFullEndpointApiUrl(ep) : '';
  });
  readonly caCert = computed(() => this.endpoint()?.ca_cert ?? '');
  // A failed reconnect does not touch the stored token, so if the endpoint
  // was already connected it still is.
  readonly stillConnected = computed(() => this.endpoint()?.connectionStatus === 'connected');

  readonly close = () => this.dialogRef.close();

  private readonly register = viewChild(CreateEndpointCfStep1Component);
  private readonly connect = viewChild(CreateEndpointConnectComponent);
  // The current connect attempt's subscriptions; each entry to Connect starts a new one.
  private connectSubs?: Subscription;
  // A connect is running or settling: Connect stays disabled until the dialog closes.
  private readonly connectBusy = signal(false);

  // Shows the registration locked; Next saves changed TLS settings.
  registerStepHandle: SignalStepHandle = {
    valid: signal(true).asReadonly(),
    submit: async () => {
      const register = this.register();
      if (!register) {
        throw new Error('Failed to save the endpoint');
      }
      const result = await firstValueFrom(register.onNext(0, {} as never));
      if (!result.success) {
        throw new Error(result.message || 'Failed to save the endpoint');
      }
      // The dialog's config, not the step's: it carries the Reconnect username.
      return { data: this.data };
    },
  };

  connectStepHandle: SignalStepHandle = {
    valid: computed(() => {
      const connect = this.connect();
      return !!connect && (!connect.doConnectSignal() || connect.validSignal());
    }),
    blocked: this.connectBusy.asReadonly(),
    finishButtonText: computed(() => this.connect()?.doConnectSignal() ? 'Connect' : 'Close'),
    onEnter: data => {
      const connect = this.connect();
      if (!connect) {
        return;
      }
      connect.onEnter(data as ConnectEndpointConfig);
      this.connectSubs?.unsubscribe();
      this.connectBusy.set(false);
      const service = connect.connectService;
      if (!service) {
        return;
      }
      this.connectSubs = service.isBusy$.subscribe(busy => this.connectBusy.set(busy));
      this.connectSubs.add(service.hasConnected$.subscribe(reported => {
        if (!reported) {
          this.snackBarService.show(`Connected endpoint '${this.data.name}'`);
        }
        this.close();
      }));
    },
    submit: async () => {
      const connect = this.connect();
      if (!connect?.doConnect) {
        this.close();
        return { ignoreSuccess: true };
      }
      const result = await firstValueFrom(connect.onNext());
      // Success closes the dialog once the endpoint reads connected
      // (hasConnected$). A failure is shown under the form, so the stepper
      // adds no message of its own.
      return result.success ? { ignoreSuccess: true } : { success: false };
    },
  };

  constructor() {
    // Name the dialog by its title. The id depends on the endpoint, which
    // the call sites' shared open() options cannot name.
    const host: HTMLElement = inject(ElementRef).nativeElement;
    afterNextRender(() => host.closest('[role="dialog"]')?.setAttribute('aria-labelledby', this.titleId));
  }

  onUnregistered() {
    this.snackBarService.show(`Unregistered ${this.data.name}`);
    this.close();
  }

  ngOnDestroy(): void {
    this.connectSubs?.unsubscribe();
  }
}
