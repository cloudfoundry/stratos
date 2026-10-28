import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ComponentRef,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewContainerRef,
  computed,
  inject,
  signal,
  input
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { entityCatalog } from '@stratosui/store';
import { firstValueFrom, Subscription } from 'rxjs';

import { getIdFromRoute } from '../../../core/utils.service';
import { normalizeUrl } from '../../../shared/validators';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { SignalStepHandle, StepComponent } from '../../../shared/components/stepper/step/step.component';
import { SteppersComponent } from '../../../shared/components/stepper/steppers/steppers.component';
import { ENDPOINT_REGISTER_HANDLE, leaveEndpointRegistration } from '../endpoint-register-modal/endpoint-register-handle';
import { CreateEndpointCfStep1Component } from './create-endpoint-cf-step-1/create-endpoint-cf-step-1.component';
import { CreateEndpointConnectComponent } from './create-endpoint-connect/create-endpoint-connect.component';

@Component({
  selector: 'app-create-endpoint',
  templateUrl: './create-endpoint.component.html',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    SteppersComponent,
    StepComponent,
    CreateEndpointCfStep1Component,
    CreateEndpointConnectComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateEndpointComponent implements OnInit, AfterViewInit, OnDestroy {

  // When rendered inside the endpoint register modal, hide the nested
  // <app-page-header>. Two nested page-headers clobber the TabNavService
  // pageHeader signal — the inner one's ngOnDestroy on modal close clears
  // the signal and the outer (endpoints-page) header disappears until a
  // hard reload.
  readonly hideHeader = input(false);

  showConnectStep: boolean;

  component: any;
  @ViewChild('customComponentContainer', { read: ViewContainerRef, static: true }) customComponentContainer!: ViewContainerRef;
  componentRef!: ComponentRef<any>;

  // FWT-959 Part 2 (Partition A) — SignalStepHandle wiring for the inline
  // CF/metrics wizard. The dynamic-component path (`this.component`) is
  // used when the endpoint type ships its own registrationComponent (e.g.
  // KubeConfigRegistrationComponent, GitRegistrationComponent); those
  // children manage their own steppers and are migrated separately. The
  // handles below only drive the inline flow (Register, plus Connect for
  // types that can connect) rendered when no custom registrationComponent
  // is wired up.
  @ViewChild('step1', { static: false }) step1?: CreateEndpointCfStep1Component;

  // Signal-backed (not a plain field): the connect step is instantiated
  // lazily on activation, and the handle computeds below dereference it.
  // A computed whose first evaluation sees an undefined plain field
  // captures zero signal dependencies and never re-evaluates.
  private _connect = signal<CreateEndpointConnectComponent | undefined>(undefined);
  @ViewChild('connect', { static: false })
  set connectRef(v: CreateEndpointConnectComponent | undefined) {
    this._connect.set(v);
  }

  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  // Present when hosted by the Register Endpoint dialog, which this form
  // closes instead of navigating to /endpoints (the page under the dialog).
  private registerHandle = inject(ENDPOINT_REGISTER_HANDLE, { optional: true });
  readonly cancelAction = this.registerHandle ? () => this.registerHandle!.close(false) : undefined;

  // step1.validate is an Observable — we mirror it into a signal once the
  // view initialises (it's constructed lazily in ngAfterContentInit).
  private step1Valid = signal<boolean>(false);
  private step1ValidateSub?: Subscription;

  // The endpoint step 1 registered. Previous never undoes it; step 1 shows it
  // locked and offers Unregister, which clears this.
  private registered = signal(false);

  // What the Connect step's Register strip shows.
  protected readonly address = signal('');
  protected readonly caCert = signal('');

  onUnregistered() {
    this.registered.set(false);
  }

  step1StepHandle: SignalStepHandle = {
    valid: this.step1Valid.asReadonly(),
    nextButtonText: computed(() => this.registered() ? 'Next' : 'Register'),
    submit: async () => {
      // Delegate to the existing onNext to preserve all of its
      // side-effects (snackbar, dup-endpoint warning, store dispatch).
      const result = await firstValueFrom(this.step1!.onNext(0, {} as any));
      if (!result.success) {
        throw new Error(result.message || 'Failed to register endpoint');
      }
      this.registered.set(true);
      // As registered: registration adds https:// to a bare host.
      this.address.set(normalizeUrl(this.step1?.registerForm?.getRawValue().urlField ?? ''));
      this.caCert.set(this.step1?.registeredCaCert?.() ?? '');
      // `redirect: true` (only emitted when finalStep is set, i.e. when
      // there's no connect step) means the form is done.
      if (result.redirect) {
        await leaveEndpointRegistration(this.registerHandle, this.router, true);
        return;
      }
      // Hand the registration result to the connect step via the stepper's
      // enterData channel — the connect child does not exist yet at submit
      // time (step content instantiates on activation), so a direct
      // this.connect.onEnter(...) here silently no-ops.
      return { data: result.data };
    },
  };

  // The connect child's `valid`/`doConnect` are signal-backed (see
  // CreateEndpointConnectComponent); we read them inside computeds so the
  // step handle re-evaluates without polling.
  connectStepHandle: SignalStepHandle = {
    valid: computed(() => {
      if (!this.registered()) return false;
      const c = this._connect();
      if (!c) return true;
      return c.doConnectSignal() ? c.validSignal() : true;
    }),
    disablePrevious: signal(false).asReadonly(),
    hideCloseButton: signal(true).asReadonly(),
    finishButtonText: computed(() => {
      const c = this._connect();
      return c?.doConnectSignal() ? 'Connect' : 'Close';
    }),
    onEnter: (data) => {
      // Registration result routed from step1's submit via the stepper's
      // enterData channel. Delivery is deferred past the activating
      // render, so the ViewChild is set by now.
      if (data) {
        this._connect()?.onEnter(data as any);
      }
    },
    submit: async () => {
      const result = await firstValueFrom(this._connect()!.onNext());
      // A failure is shown under the form, so the stepper adds no message
      // of its own.
      if (!result.success) {
        return { success: false };
      }
      // Connect's legacy onNext always returns redirect:true on success,
      // meaning the form is done.
      if (result.redirect) {
        await leaveEndpointRegistration(this.registerHandle, this.router, true);
      }
    },
  };

  constructor() {
    const activatedRoute = inject(ActivatedRoute);

    const epType = getIdFromRoute(activatedRoute, 'type');
    const epSubType = getIdFromRoute(activatedRoute, 'subtype');
    const endpoint = entityCatalog.getEndpoint(epType, epSubType);

    this.component = endpoint?.definition?.registrationComponent;
    this.showConnectStep = !endpoint?.definition?.unConnectable ?
      !!endpoint?.definition?.authTypes?.length :
      false;
  }

  ngOnInit() {
    this.customComponentContainer.clear();
    if (this.componentRef) {
      this.componentRef.destroy();
    }
    if (this.component) {
      this.componentRef = this.customComponentContainer.createComponent(this.component);
    }
  }

  ngAfterViewInit() {
    // Bridge the CF step-1 form-validity Observable into our signal so
    // the step handle's `valid` re-evaluates reactively. Only present
    // when the inline wizard is rendered (i.e. no custom registration
    // component took over). `validate` is constructed lazily in
    // step1.ngAfterContentInit, so wait one microtask before subscribing.
    if (this.step1) {
      queueMicrotask(() => {
        if (this.step1?.validate) {
          this.step1ValidateSub = this.step1.validate.subscribe(v => {
            this.step1Valid.set(!!v);
            this.cdr.markForCheck();
          });
        }
      });
    }
  }

  ngOnDestroy() {
    if (this.componentRef) {
      this.componentRef.destroy();
    }
    this.step1ValidateSub?.unsubscribe();
  }

}
