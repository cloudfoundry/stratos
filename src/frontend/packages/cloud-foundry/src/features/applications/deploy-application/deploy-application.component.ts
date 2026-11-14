import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  effect,
  OnInit,
  Signal,
  computed,
  inject,
  signal,
  untracked,
  viewChild,
  afterRenderEffect,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@stratosui/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { AsyncPipe } from '@angular/common';

import { SourceType } from '../../../store/types/deploy-application.types';
import { CfDeployAppDataService } from '../../../services/domain-data/cf-deploy-app-data.service';
import { CfAppsSignalConfigService } from '../../../shared/signal-list-configs/app/cf-apps-signal-config.service';
import { CfOrgSpaceDataService } from '../../../shared/data-services/cf-org-space-service.service';
import { AUTO_SELECT_CF_URL_PARAM, RETURN_URL_PARAM } from '../new-application-base-step/new-application-base-step.component';
import { ApplicationDeploySourceTypes } from './deploy-application-steps.types';
import { PageHeaderComponent, SignalStepHandle, SteppersComponent, StepComponent } from '@stratosui/core';
import { CreateApplicationStep1Component } from '../../../shared/components/create-application/create-application-step1/create-application-step1.component';
import { DeployApplicationStep2Component } from './deploy-application-step2/deploy-application-step2.component';
import { DeployApplicationStep21Component } from './deploy-application-step2-1/deploy-application-step2-1.component';
import { DeployApplicationStepSourceUploadComponent } from './deploy-application-step-source-upload/deploy-application-step-source-upload.component';
import { DeployApplicationOptionsStepComponent } from './deploy-application-options-step/deploy-application-options-step.component';
import { DeployApplicationStep3Component } from './deploy-application-step3/deploy-application-step3.component';

@Component({
  selector: 'app-deploy-application',
  templateUrl: './deploy-application.component.html',
  providers: [
    CfOrgSpaceDataService,
    ApplicationDeploySourceTypes,
    { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher }
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    PageHeaderComponent,
    SteppersComponent,
    StepComponent,
    CreateApplicationStep1Component,
    DeployApplicationStep2Component,
    DeployApplicationStep21Component,
    DeployApplicationStepSourceUploadComponent,
    DeployApplicationOptionsStepComponent,
    DeployApplicationStep3Component
]
})
export class DeployApplicationComponent implements OnInit {
  private router = inject(Router);
  cfOrgSpaceService = inject(CfOrgSpaceDataService);
  private appsConfig = inject(CfAppsSignalConfigService);
  private activatedRoute = inject(ActivatedRoute);
  private deployData = inject(CfDeployAppDataService);
  private injector = inject(Injector);

  appGuid: string;
  // Where Cancel returns to — the CF-scoped wall when launched from one
  // (?returnUrl, set by new-application-base-step), else the global wall.
  readonly returnUrl: string = this.activatedRoute.snapshot.queryParams[RETURN_URL_PARAM] || '/applications';
  deployButtonText = 'Deploy';
  // A public git URL has no project to browse, so its commit step is skipped
  readonly skipConfig = computed(() => this.deployData.applicationSource()?.type?.id === 'giturl');
  isRedeploy: boolean;
  // undefined when the wizard is opened without an auto-select query param
  // (getAutoSelectedType returns of(undefined)); the title guards for it.
  selectedSourceType$: Observable<SourceType | undefined>;
  // The source type is looked up once; the title follows it.
  private readonly selectedSourceType: Signal<SourceType | undefined>;

  // Reactive deploy button text — switches to "Redeploy" when the
  // wizard is invoked with an existing appGuid, and to "Deploy again" once
  // a deploy has started. Step 4's handle reads
  // this signal so changing the field once at construction time
  // cascades into the rendered button label.
  private deployButtonTextSignal = signal<string>('Deploy');

  // FWT-959 Part 2 (Partition B): SignalStepHandle wiring for the
  // deploy-application flow (up to 6 steps). Cross-step state continues
  // to live in deploy-application.actions selectors + the per-component
  // ApplicationDeploySourceTypes provider — children read/write it via
  // the existing surface.
  //
  // The steppers component renders only the active step's content
  // template at any given time (steppers.component.html line 71:
  // `<span *ngTemplateOutlet="steps[currentIndex].content">`), so child
  // components are instantiated lazily on activation. An effect on each
  // view query calls its `wireStep...` method, so the bridge subscription
  // is wired the moment the child becomes available — and torn down (the
  // effect's cleanup) when the user navigates away.
  //
  // Step 1 (Cloud Foundry) is conditionally rendered via @if (!appGuid)
  // — a true template guard — so its handle never wires up when the
  // user is redeploying. Steps 2_1 and 2_2 use legacy [hidden] bindings
  // (still served by the @Input fall-through) for source-type-driven
  // visibility; the legacy [skip]="step2_2.skip$ | async" binding on
  // step2_2 was a no-op (the child has no skip$ field) and has been
  // removed in the migration.
  private readonly step1 = viewChild<CreateApplicationStep1Component>('step1');
  private readonly step2 = viewChild<DeployApplicationStep2Component>('step2');
  private readonly step2_1 = viewChild<DeployApplicationStep21Component>('step2_1');
  private readonly step2_2 = viewChild<DeployApplicationStepSourceUploadComponent>('step2_2');
  private readonly step4 = viewChild<DeployApplicationOptionsStepComponent>('step4');
  private readonly step3 = viewChild<DeployApplicationStep3Component>('step3');

  private step1Valid = signal<boolean>(false);
  private step2Valid = signal<boolean>(false);
  // Steps 2_1 and 3 keep their state in signals, so the parent reads it
  // straight from the step once its view query resolves.
  private step2_1Valid = computed(() => this.step2_1()?.validate() ?? false);
  private step2_2Valid = signal<boolean>(false);
  private step4Valid = signal<boolean>(false);
  private step3Valid = computed(() => this.step3()?.valid() ?? false);
  private step3Closeable = computed(() => this.step3()?.closeable() ?? false);
  private step3DisablePrevious = computed(() => this.step3()?.disablePrevious() ?? true);

  // Carries the deployer instance forward from step2_2 (source-upload)
  // to step3 (deploy progress). The legacy stepper relayed this via
  // `enterData` between step.onNext.data → next step.onEnter(enterData);
  // signal-handle submit() drops the `data` channel, so the parent
  // captures it explicitly here. step2_2's submit stores the deployer,
  // step3Handle.onEnter forwards it to step3.onEnter on activation.
  private pendingDeployer?: unknown;
  // FileScannerInfo from step2's source-select onNext, consumed by
  // step2_2Handle.onEnter to prime deployer.fsFileInfo. Without this,
  // the file-upload deploy path never opens the deploy WebSocket because
  // deployer.open()'s readyFilter falls into the git/docker branch (which
  // requires gitDetails or dockerDetails). The legacy stepper relayed
  // step2's onNext.data into step2_2.onEnter via enterData.
  private pendingFsFileInfo?: unknown;

  private isLoadingSignal = this.cfOrgSpaceService.isLoading;

  // Calls `wire` with a step's child whenever its view query changes, after
  // dropping the subscription made for the previous child.
  private bridge<T>(query: () => T | undefined, wire: (child: T | undefined) => Subscription | undefined) {
    // After render: a step's child creates its streams in its own init
    // hooks, which run after this component's effects.
    return afterRenderEffect(onCleanup => {
      const child = query();
      untracked(() => {
        const sub = wire(child);
        onCleanup(() => sub?.unsubscribe());
      });
    });
  }

  private readonly step1Bridge = this.bridge(this.step1, v => this.wireStep1(v));
  private readonly step2Bridge = this.bridge(this.step2, v => this.wireStep2(v));
  private readonly step2_2Bridge = this.bridge(this.step2_2, v => this.wireStep2_2(v));
  private readonly step4Bridge = this.bridge(this.step4, v => this.wireStep4(v));

  private wireStep1(v: CreateApplicationStep1Component | undefined): Subscription | undefined {
    if (!v) {
      this.step1Valid.set(false);
      return undefined;
    }
    return v.validate.subscribe(valid => {
      this.step1Valid.set(!!valid);
    });
  }

  private wireStep2(v: DeployApplicationStep2Component | undefined): Subscription | undefined {
    if (!v) {
      this.step2Valid.set(false);
      return undefined;
    }
    return v.validate.subscribe(valid => {
      this.step2Valid.set(!!valid);
    });
  }

  private wireStep2_2(v: DeployApplicationStepSourceUploadComponent | undefined): Subscription | undefined {
    if (!v) {
      this.step2_2Valid.set(false);
      return undefined;
    }
    // Subscription wiring only. The activation-time `onEnter` call that
    // primes `deployer.fsFileInfo` lives on `step2_2Handle.onEnter` — it
    // fires when the stepper navigates *into* this step, after step 2's
    // submit has populated `pendingFsFileInfo`. Calling `v.onEnter` here
    // (on view-init) would run with `pendingFsFileInfo === undefined`
    // because `<app-step [hidden]>` keeps step 2_2 instantiated up-front,
    // so this runs before step 2 ever submits.
    return v.valid$.subscribe(valid => {
      this.step2_2Valid.set(!!valid);
    });
  }

  private wireStep4(v: DeployApplicationOptionsStepComponent | undefined): Subscription | undefined {
    if (!v) {
      this.step4Valid.set(false);
      return undefined;
    }
    // Replicate the legacy [onEnter]="step4.onEnter" — the options step
    // re-evaluates its form on entry (resets / merges manifest-derived
    // defaults). The framework would normally pass deployer info as
    // `data` — see comment on step2_2 for why we pass undefined.
    v.onEnter(undefined);
    return v.valid$.subscribe(valid => {
      this.step4Valid.set(!!valid);
    });
  }

  step1Handle: SignalStepHandle = {
    valid: this.step1Valid.asReadonly(),
    blocked: computed(() => !!this.isLoadingSignal()),
    submit: async () => {
      // The legacy template wired step 1's submit to the *parent*'s
      // onNext — push the picker selections into the deploy-data
      // service so downstream steps (step 2, options) can read them.
      this.deployData.setCfDetails({
        cloudFoundry: this.cfOrgSpaceService.cf.select(),
        org: this.cfOrgSpaceService.org.select(),
        space: this.cfOrgSpaceService.space.select(),
      });
    },
  };

  step2Handle: SignalStepHandle = {
    valid: this.step2Valid.asReadonly(),
    submit: async () => {
      const result = await this.step2()!.onNext();
      if (!result.success) {
        throw new Error(result.message || 'Failed to save source type');
      }
      // Capture the FileScannerInfo for step2_2 to consume on activation
      // (file-upload path only — git-url/docker source paths leave data
      // undefined and step2_2 isn't navigated to).
      this.pendingFsFileInfo = result.data;
      // A source chosen again needs its own upload: a file source passes
      // through step 2_2, which hands on a deployer; others need none
      this.pendingDeployer = undefined;
    },
  };

  step2_1Handle: SignalStepHandle = {
    valid: this.step2_1Valid,
    // Activation-time build of the commit list. Runs on each entry (not at
    // ViewChild init) so it reads the git source that step 2's submit just
    // saved — the commit-list wrapper resolves project/branch from
    // applicationSource, which is empty until then. Re-entries after a
    // Previous click also rebuild against the latest selection.
    onEnter: () => this.step2_1()?.onEnter(),
    onLeave: () => this.step2_1()?.onLeave(),
    submit: async () => {
      const result = await this.step2_1()!.onNext();
      if (!result.success) {
        throw new Error(result.message || 'Failed to save source config');
      }
    },
  };

  step2_2Handle: SignalStepHandle = {
    valid: this.step2_2Valid.asReadonly(),
    // Activation-time hand-off of step 2's captured FileScannerInfo into
    // the source-upload component. Has to run on each entry (not just on
    // ViewChild init) so re-entries after a Previous click also re-prime
    // the freshly-constructed deployer. See `wireStep2_2` comment for the
    // ViewChild-fires-once trap this avoids.
    onEnter: () => {
      this.step2_2()?.onEnter(this.pendingFsFileInfo as any);
      this.pendingFsFileInfo = undefined;
    },
    onLeave: (isNext?: boolean) => this.step2_2()?.onLeave(!!isNext),
    submit: async () => {
      const result = await this.step2_2()!.onNext();
      if (!result.success) {
        throw new Error(result.message || 'Failed to upload source');
      }
      // Capture the deployer so step 3 picks it up on activation —
      // mirrors the legacy enterData hand-off the framework no longer
      // performs for signal-handle submits.
      this.pendingDeployer = result.data;
    },
  };

  step4Handle: SignalStepHandle = {
    valid: this.step4Valid.asReadonly(),
    nextButtonText: this.deployButtonTextSignal.asReadonly(),
    submit: async () => {
      const result = await this.step4()!.onNext();
      if (!result.success) {
        throw new Error(result.message || 'Failed to save deploy options');
      }
    },
  };

  step3Handle: SignalStepHandle = {
    valid: this.step3Valid,
    // Activation-time hand-off of step 2_2's deployer. Same rationale as
    // `step2_2Handle.onEnter` — ViewChild-time would run with
    // `pendingDeployer === undefined`. Source types that bypass step 2_2
    // (git-url, docker-image) leave pendingDeployer undefined and step 3
    // instantiates a fresh deployer.
    // The deployer is kept: entering again after a file deploy ended (via
    // Previous to the overrides) uploads the same files again and deploys.
    // Previous from here leads back to the overrides, whose Next then
    // deploys again.
    onEnter: () => {
      this.deployButtonTextSignal.set('Deploy again');
      this.step3()?.onEnter(this.pendingDeployer as any);
    },
    canClose: this.step3Closeable,
    disablePrevious: this.step3DisablePrevious,
    // step3.disablePrevious is true from entry until the deploy ends,
    // which is also when the step header should show it busy, so
    // showBusy reuses that signal.
    showBusy: this.step3DisablePrevious,
    cancelButtonText: signal('Close').asReadonly(),
    finishButtonText: signal('Go to App Summary').asReadonly(),
    submit: async () => {
      const result = await this.step3()!.onNext();
      if (!result.success) {
        throw new Error(result.message || 'Deploy failed');
      }
    },
  };

  constructor() {
    const activatedRoute = this.activatedRoute;
    const appDeploySourceTypes = inject(ApplicationDeploySourceTypes);

    this.appGuid = this.activatedRoute.snapshot.queryParams.appGuid;
    this.isRedeploy = !!this.appGuid;

    this.selectedSourceType$ = appDeploySourceTypes.getAutoSelectedType(activatedRoute);
    this.selectedSourceType = toSignal(this.selectedSourceType$);

    if (this.isRedeploy) {
      this.deployButtonText = 'Redeploy';
      this.deployButtonTextSignal.set('Redeploy');
    }
  }

  ngOnInit(): void {
    // Has the endpoint ID been specified in the URL?
    const endpoint = this.activatedRoute.snapshot.queryParams[AUTO_SELECT_CF_URL_PARAM];
    if (endpoint) {
      this.cfOrgSpaceService.cf.select.set(endpoint);
    }

    if (this.appGuid) {
      effect(() => {
        const details = this.deployData.cfDetails();
        untracked(() => {
          if (details) {
            this.cfOrgSpaceService.cf.select.set(details.cloudFoundry);
            this.cfOrgSpaceService.org.select.set(details.org);
            this.cfOrgSpaceService.space.select.set(details.space);
          } else {
            // In case user has specified the query param manually
            this.router.navigate(['applications', 'deploy']);
          }
        });
      }, { injector: this.injector });
    } else {
      // Auto-select endpoint/org/space from the apps wall's current filter
      // (root-scoped CfAppsSignalConfigService keeps them in signals — read
      // directly instead of round-tripping through ngrx pagination state).
      const cf = this.appsConfig.selectedCnsi();
      const org = this.appsConfig.selectedOrg();
      const space = this.appsConfig.selectedSpace();
      if (cf) {
        this.cfOrgSpaceService.cf.select.set(cf);
      }
      if (org) {
        this.cfOrgSpaceService.org.select.set(org);
      }
      if (space) {
        this.cfOrgSpaceService.space.select.set(space);
      }
      // Delete any state in deployApplication
      this.deployData.resetState();
    }
  }

  readonly title = computed(() => {
    if (this.appGuid) {
      return 'Redeploy';
    }
    const selectedSourceType = this.selectedSourceType();
    return `Deploy ${selectedSourceType ? 'from ' + selectedSourceType.name : ''}`;
  });
}
