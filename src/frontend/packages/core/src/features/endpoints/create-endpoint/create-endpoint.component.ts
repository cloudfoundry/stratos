import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ComponentRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewContainerRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { entityCatalog } from '@stratosui/store';
import { firstValueFrom, Subscription } from 'rxjs';

import { getIdFromRoute } from '../../../core/utils.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { SignalStepHandle, StepComponent } from '../../../shared/components/stepper/step/step.component';
import { SteppersComponent } from '../../../shared/components/stepper/steppers/steppers.component';
import { EndpointsSignalConfigService } from '../endpoints-page/endpoints-signal-config.service';
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
  @Input() hideHeader = false;

  showConnectStep: boolean;

  component: any;
  @ViewChild('customComponentContainer', { read: ViewContainerRef, static: true }) customComponentContainer!: ViewContainerRef;
  componentRef!: ComponentRef<any>;

  // FWT-959 Part 2 (Partition A) — SignalStepHandle wiring for the inline
  // CF/metrics wizard. The dynamic-component path (`this.component`) is
  // used when the endpoint type ships its own registrationComponent (e.g.
  // KubeConfigRegistrationComponent, GitRegistrationComponent); those
  // children manage their own steppers and are migrated separately. The
  // handles below only drive the legacy inline 2-step flow rendered when
  // no custom registrationComponent is wired up.
  @ViewChild('step1', { static: false }) step1?: CreateEndpointCfStep1Component;
  @ViewChild('connect', { static: false }) connect?: CreateEndpointConnectComponent;

  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private endpointsSignalConfig = inject(EndpointsSignalConfigService);

  // step1.validate is an Observable — we mirror it into a signal once the
  // view initialises (it's constructed lazily in ngAfterContentInit).
  private step1Valid = signal<boolean>(false);
  private step1ValidateSub?: Subscription;

  // Tracks the endpoint guid created by step 1's submit — used by the
  // connect-step's onLeave(isNext=false) handler to unregister on
  // Previous ("Prev = start over"). Cleared after unregister so the form
  // can re-register cleanly. Mirrors git-registration's pattern.
  private registeredGuid: string | null = null;
  private registeredType: string | null = null;

  step1StepHandle: SignalStepHandle = {
    valid: this.step1Valid.asReadonly(),
    nextButtonText: signal('Register').asReadonly(),
    submit: async () => {
      // Delegate to the existing onNext to preserve all of its
      // side-effects (snackbar, dup-endpoint warning, store dispatch).
      const result = await firstValueFrom(this.step1!.onNext(0, {} as any));
      if (!result.success) {
        throw new Error(result.message || 'Failed to register endpoint');
      }
      // Capture the guid+type so Previous from step 2 can unregister.
      if (result.data) {
        this.registeredGuid = result.data.guid;
        this.registeredType = result.data.type;
      }
      // Hand the registration result to the connect step before advance —
      // the legacy `onEnter`-via-data path that the stepper used to drive.
      if (this.connect && result.data) {
        this.connect.onEnter(result.data);
      }
      // Legacy `redirect: true` (only emitted when finalStep is set, i.e.
      // when there's no connect step) means "navigate back to /endpoints".
      if (result.redirect) {
        await this.router.navigate(['/endpoints']);
      }
    },
  };

  // The connect child's `valid`/`doConnect` are signal-backed (see
  // CreateEndpointConnectComponent); we read them inside computeds so the
  // step handle re-evaluates without polling.
  connectStepHandle: SignalStepHandle = {
    valid: computed(() => {
      const c = this.connect;
      if (!c) return true;
      return c.doConnectSignal() ? c.validSignal() : true;
    }),
    disablePrevious: signal(false).asReadonly(),
    hideCloseButton: signal(true).asReadonly(),
    finishButtonText: computed(() => {
      const c = this.connect;
      return c?.doConnectSignal() ? 'Connect' : 'Finish';
    }),
    onEnter: () => {
      // The data is set by step1's submit before advance — nothing more
      // to do here. Kept as a no-op so the handle's onEnter contract is
      // explicit (vs falling through to legacy storage).
    },
    onLeave: async (isNext) => {
      if (isNext || !this.registeredGuid || !this.registeredType) {
        return;
      }
      // Previous from connect step ⇒ "start over": unregister the endpoint
      // we just created so the user can re-fill or pick a different type
      // on a clean step 1.
      const guid = this.registeredGuid;
      const type = this.registeredType;
      this.registeredGuid = null;
      this.registeredType = null;
      await this.endpointsSignalConfig.unregister(guid, type);
    },
    submit: async () => {
      const result = await firstValueFrom(this.connect!.onNext());
      if (!result.success) {
        throw new Error(result.message || 'Failed to connect endpoint');
      }
      // Connect's legacy onNext always returns redirect:true on success,
      // meaning "navigate to the stepper's cancel URL" — for this stepper
      // that is /endpoints.
      if (result.redirect) {
        await this.router.navigate(['/endpoints']);
      }
    },
  };

  constructor() {
    const activatedRoute = inject(ActivatedRoute);

    const epType = getIdFromRoute(activatedRoute, 'type');
    const epSubType = getIdFromRoute(activatedRoute, 'subtype');
    const endpoint = entityCatalog.getEndpoint(epType, epSubType);

    this.component = endpoint.definition.registrationComponent;
    this.showConnectStep = !endpoint.definition.unConnectable ?
      endpoint.definition.authTypes && !!endpoint.definition.authTypes.length :
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
