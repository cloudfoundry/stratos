import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Subscription, firstValueFrom } from 'rxjs';

import { PageHeaderComponent, SignalStepHandle, StepComponent, SteppersComponent } from '@stratosui/core';
import { CreateApplicationStep1Component } from '../../../shared/components/create-application/create-application-step1/create-application-step1.component';
import { CfOrgSpaceDataService } from '../../../shared/data-services/cf-org-space-service.service';
import { CfAppsSignalConfigService } from '../../../shared/components/list/list-types/app/cf-apps-signal-config.service';
import { CreateApplicationStep2Component } from './create-application-step2/create-application-step2.component';
import { CreateApplicationStep3Component } from './create-application-step3/create-application-step3.component';

@Component({
  selector: 'app-create-application',
  templateUrl: './create-application.component.html',
  providers: [CfOrgSpaceDataService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    SteppersComponent,
    StepComponent,
    CreateApplicationStep1Component,
    CreateApplicationStep2Component,
    CreateApplicationStep3Component
  ]
})
export class CreateApplicationComponent implements OnInit, OnDestroy {

  private cdr = inject(ChangeDetectorRef);
  public cfOrgSpaceService = inject(CfOrgSpaceDataService);
  private appsConfig = inject(CfAppsSignalConfigService);

  // FWT-959 Part 2 (Partition B): SignalStepHandle wiring for the 3-step
  // create-application flow. Cross-step state (CF/org/space + new app
  // name) lives in CfOrgSpaceDataService + the signal-native
  // CreateAppStateService — children read/write it via that service.
  //
  // The steppers component renders only the active step's content
  // template at any given time (see steppers.component.html line 71:
  // `<span *ngTemplateOutlet="steps[currentIndex].content">`), so
  // children for non-active steps are not instantiated. We use
  // ViewChild *setters* so the bridge subscription is wired the moment
  // the child instance becomes available — and torn down when the
  // child reference flips back to undefined as the user navigates
  // away. This sidesteps relying on signal-handle onEnter being routed
  // through the steppers component for bridge wiring.
  private _step1?: CreateApplicationStep1Component;
  private _step2?: CreateApplicationStep2Component;
  private _step3?: CreateApplicationStep3Component;
  private step1Valid = signal<boolean>(false);
  private step2Valid = signal<boolean>(false);
  private step3Valid = signal<boolean>(false);
  private step1Sub?: Subscription;
  private step2Sub?: Subscription;
  private step3Sub?: Subscription;

  @ViewChild('step1', { static: false })
  set step1Ref(v: CreateApplicationStep1Component | undefined) {
    this._step1 = v;
    this.step1Sub?.unsubscribe();
    this.step1Sub = undefined;
    if (v) {
      this.step1Sub = v.validate.subscribe(valid => {
        this.step1Valid.set(!!valid);
        this.cdr.markForCheck();
      });
    } else {
      this.step1Valid.set(false);
    }
  }

  @ViewChild('step2', { static: false })
  set step2Ref(v: CreateApplicationStep2Component | undefined) {
    this._step2 = v;
    this.step2Sub?.unsubscribe();
    this.step2Sub = undefined;
    if (v) {
      // Replicate the legacy [onEnter]="step2.onEnter" binding — the child
      // re-validates its appName control on entry so the statusChanges
      // stream emits a fresh value into the bridge.
      v.onEnter();
      this.step2Sub = v.validate.subscribe(valid => {
        this.step2Valid.set(!!valid);
        this.cdr.markForCheck();
      });
    } else {
      this.step2Valid.set(false);
    }
  }

  @ViewChild('step3', { static: false })
  set step3Ref(v: CreateApplicationStep3Component | undefined) {
    this._step3 = v;
    this.step3Sub?.unsubscribe();
    this.step3Sub = undefined;
    if (v) {
      // step3.validate is a synchronous method over the form. Seed once,
      // then mirror statusChanges → local signal so OnPush re-renders.
      this.step3Valid.set(v.validate());
      this.step3Sub = v.setDomainHost.statusChanges.subscribe(() => {
        this.step3Valid.set(this._step3?.validate() ?? false);
        this.cdr.markForCheck();
      });
    } else {
      this.step3Valid.set(false);
    }
  }

  // Mirror the cross-step loading state so step1's handle can drive
  // [blocked] reactively without leaning on async pipes inside the
  // template — keeps the template purely declarative on the handle.
  private isLoadingSignal = this.cfOrgSpaceService.isLoading;

  step1Handle: SignalStepHandle = {
    valid: this.step1Valid.asReadonly(),
    blocked: computed(() => !!this.isLoadingSignal()),
    submit: async () => {
      // step1.onNext stores the CF details via CreateAppStateService and returns of({ success: true }).
      const result = await firstValueFrom(this._step1!.onNext(0, null as any));
      if (!result.success) {
        throw new Error(result.message || 'Failed to save Cloud Foundry details');
      }
    },
  };

  step2Handle: SignalStepHandle = {
    valid: this.step2Valid.asReadonly(),
    submit: async () => {
      const result = await firstValueFrom(this._step2!.onNext(1, null as any));
      if (!result.success) {
        throw new Error(result.message || 'Failed to save application name');
      }
    },
  };

  step3Handle: SignalStepHandle = {
    valid: this.step3Valid.asReadonly(),
    submit: async () => {
      // step3.onNext kicks off create-app + create-route + assign-route,
      // dispatches the navigation RouterNav action on success and maps
      // errors to { success: false, message }. The RouterNav drives
      // navigation, so no explicit Router.navigate replacement is needed.
      const result = await firstValueFrom(this._step3!.onNext(2, null as any));
      if (!result.success) {
        throw new Error(result.message || 'Failed to create application');
      }
    },
  };

  ngOnInit() {
    // Auto-select endpoint/org/space from the apps wall's current filter
    // selections — root-scoped CfAppsSignalConfigService holds them in
    // signals, so the stepper reads them directly without a store hop.
    this.cfOrgSpaceService.enableAutoSelectors();
    const cf = this.appsConfig.selectedCnsi();
    const org = this.appsConfig.selectedOrg();
    const space = this.appsConfig.selectedSpace();
    if (cf) {
      this.cfOrgSpaceService.cf.select.set(cf);
    }
    if (cf && org) {
      this.cfOrgSpaceService.org.select.set(org);
    }
    if (cf && org && space) {
      this.cfOrgSpaceService.space.select.set(space);
    }
  }
  ngOnDestroy(): void {
    this.step1Sub?.unsubscribe();
    this.step2Sub?.unsubscribe();
    this.step3Sub?.unsubscribe();
  }

}
