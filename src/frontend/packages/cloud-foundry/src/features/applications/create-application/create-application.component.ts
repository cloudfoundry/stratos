import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  computed,
  inject,
  signal,
  untracked,
  viewChild,
  afterRenderEffect,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { PageHeaderComponent, SignalStepHandle, StepComponent, SteppersComponent } from '@stratosui/core';
import { RETURN_URL_PARAM } from '../new-application-base-step/new-application-base-step.component';
import { CreateApplicationStep1Component } from '../../../shared/components/create-application/create-application-step1/create-application-step1.component';
import { CfOrgSpaceDataService } from '../../../shared/data-services/cf-org-space-service.service';
import { CfAppsSignalConfigService } from '../../../shared/signal-list-configs/app/cf-apps-signal-config.service';
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
export class CreateApplicationComponent implements OnInit {

  private cdr = inject(ChangeDetectorRef);
  public cfOrgSpaceService = inject(CfOrgSpaceDataService);
  private appsConfig = inject(CfAppsSignalConfigService);
  private route = inject(ActivatedRoute);

  // Where Cancel returns to — the CF-scoped wall when this flow was launched
  // from one (?returnUrl set by new-application-base-step), else the global wall.
  readonly returnUrl: string = this.route.snapshot.queryParams[RETURN_URL_PARAM] || '/applications';

  // FWT-959 Part 2 (Partition B): SignalStepHandle wiring for the 3-step
  // create-application flow. Cross-step state (CF/org/space + new app
  // name) lives in CfOrgSpaceDataService + the signal-native
  // CreateAppStateService — children read/write it via that service.
  //
  // The steppers component shows only the active step's content
  // (`*ngTemplateOutlet="steps[currentIndex()].content"`), but Ivy
  // builds every step's projected content with this view on first
  // render, whichever step is active (pinned by the projected step
  // content spec in steppers.component.spec.ts). So all three children
  // exist up front, and navigating between steps does not create or
  // destroy them. An effect on each view query wires its bridge
  // subscription as soon as the child exists, without relying on
  // signal-handle onEnter being routed through the steppers component.
  private readonly step1 = viewChild<CreateApplicationStep1Component>('step1');
  private readonly step2 = viewChild<CreateApplicationStep2Component>('step2');
  private readonly step3 = viewChild<CreateApplicationStep3Component>('step3');
  private step1Valid = signal<boolean>(false);
  private step2Valid = signal<boolean>(false);
  private step3Valid = signal<boolean>(false);

  // The bridges run after render: a step's child creates its streams in
  // its own init hooks, which run after this component's effects.
  private readonly step1Bridge = afterRenderEffect(onCleanup => {
    const step = this.step1();
    untracked(() => {
      if (!step) {
        this.step1Valid.set(false);
        return;
      }
      const sub = step.validate.subscribe(valid => {
        this.step1Valid.set(!!valid);
        this.cdr.markForCheck();
      });
      onCleanup(() => sub.unsubscribe());
    });
  });

  private readonly step2Bridge = afterRenderEffect(onCleanup => {
    const step = this.step2();
    untracked(() => {
      if (!step) {
        this.step2Valid.set(false);
        return;
      }
      // Replicate the legacy [onEnter]="step2.onEnter" binding — the child
      // re-validates its appName control on entry so the statusChanges
      // stream emits a fresh value into the bridge.
      step.onEnter();
      const sub = step.validate.subscribe(valid => {
        this.step2Valid.set(!!valid);
        this.cdr.markForCheck();
      });
      onCleanup(() => sub.unsubscribe());
    });
  });

  private readonly step3Bridge = afterRenderEffect(onCleanup => {
    const step = this.step3();
    untracked(() => {
      if (!step) {
        this.step3Valid.set(false);
        return;
      }
      // step3.validate is a synchronous method over the form. Seed once,
      // then mirror statusChanges → local signal so OnPush re-renders.
      this.step3Valid.set(step.validate());
      const sub = step.setDomainHost.statusChanges.subscribe(() => {
        this.step3Valid.set(step.validate());
        this.cdr.markForCheck();
      });
      onCleanup(() => sub.unsubscribe());
    });
  });

  // Mirror the cross-step loading state so step1's handle can drive
  // [blocked] reactively without leaning on async pipes inside the
  // template — keeps the template purely declarative on the handle.
  private isLoadingSignal = this.cfOrgSpaceService.isLoading;

  step1Handle: SignalStepHandle = {
    valid: this.step1Valid.asReadonly(),
    blocked: computed(() => !!this.isLoadingSignal()),
    submit: async () => {
      // step1.onNext stores the CF details via CreateAppStateService and returns of({ success: true }).
      const result = await firstValueFrom(this.step1()!.onNext(0, null as any));
      if (!result.success) {
        throw new Error(result.message || 'Failed to save Cloud Foundry details');
      }
    },
  };

  step2Handle: SignalStepHandle = {
    valid: this.step2Valid.asReadonly(),
    submit: async () => {
      const result = await firstValueFrom(this.step2()!.onNext(1, null as any));
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
      const result = await firstValueFrom(this.step3()!.onNext(2, null as any));
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
}
