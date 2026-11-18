import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter, ActivatedRoute, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { of, Subject } from 'rxjs';

import { EntityCatalogTestModule, TEST_CATALOGUE_ENTITIES, generateStratosEntities, EntityCatalogHelper, EntityCatalogHelpers, EndpointsDataService } from '@stratosui/store';
import { createEmptyStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { CoreModule } from '@stratosui/core';
import { getGitHubAPIURL, GITHUB_API_URL, GitSCMService } from '@stratosui/git';

import { generateCFEntities } from '../../../cf-entity-generator';
import { CfOrgSpaceDataService } from '../../../shared/data-services/cf-org-space-service.service';
import { CfDeployAppDataService } from '../../../services/domain-data/cf-deploy-app-data.service';
import { ApplicationDeploySourceTypes } from './deploy-application-steps.types';
import { DeployApplicationComponent } from './deploy-application.component';

describe('DeployApplicationComponent', () => {
  let component: DeployApplicationComponent;
  let fixture: ComponentFixture<DeployApplicationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        createEmptyStoreModule(),
        EntityCatalogTestModule,
        CoreModule,
        NoopAnimationsModule,
        DeployApplicationComponent,
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities()
          ]
        },
        EntityCatalogHelper,
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {},
              queryParams: {}
            }
          }
        },
        CfOrgSpaceDataService,
        ApplicationDeploySourceTypes,
        { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    })
      .compileComponents();

    // Set EntityCatalogHelper after TestBed is configured
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeployApplicationComponent);
    component = fixture.componentInstance;
    // Don't call detectChanges() to avoid rendering child components
  });

  // Stands in for a step's view query: these tests do not render the
  // wizard, so the queries would otherwise stay empty.
  const stubStep = (query: string, child: object) => {
    (component as any)[query] = () => child;
  };

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Regression guard for the FWT-959 Part 2 file-upload deploy fix
  // (GH #5045). step2's onNext returns the FileScannerInfo as
  // result.data; the signal-handle submit() contract has no data
  // channel, so the parent captures into pendingFsFileInfo and
  // forwards via `step2_2Handle.onEnter` — which the stepper fires
  // on activation, after step 2's submit has already run.
  //
  // Earlier versions of this test forwarded when the child was wired
  // and wired the mock *after* submit. That order never occurs in real
  // Angular: the view query for projected content resolves at parent
  // view-init, before any submit. The old test silently passed
  // against broken production code because it mocked an order the
  // framework never produces. See KS doc
  // 2026-05-26-deploy-application-ngrx-removal for the postmortem.
  it('forwards FileScannerInfo from step2 submit to step2_2.onEnter via step2_2Handle.onEnter', async () => {
    const fakeFileInfo = { root: 'mock-root', total: 100 };
    const mockStep2 = { onNext: vi.fn().mockResolvedValue({ success: true, data: fakeFileInfo }) };
    const mockStep2_2 = { onEnter: vi.fn(), valid$: of(true) };

    // The view query resolves at parent view-init before any step
    // submit. Wiring the child must NOT forward at this point —
    // pendingFsFileInfo is still undefined, so a forward here would
    // prime the deployer with garbage and the file-upload path's
    // readyFilter would never open the deploy WebSocket.
    stubStep('step2_2', mockStep2_2);
    (component as any).wireStep2_2(mockStep2_2);
    expect(mockStep2_2.onEnter).not.toHaveBeenCalled();

    // Step 2 submits — handle.submit captures result.data into
    // pendingFsFileInfo, mirroring the legacy `enterData` channel
    // the framework no longer provides for signal-handle steps.
    stubStep('step2', mockStep2);
    await component.step2Handle.submit!();
    expect((component as any).pendingFsFileInfo).toBe(fakeFileInfo);

    // Stepper activates step 2_2 → fires handle.onEnter → the parent
    // forwards pendingFsFileInfo to the child component and clears
    // the holding field.
    component.step2_2Handle.onEnter!();
    expect(mockStep2_2.onEnter).toHaveBeenCalledWith(fakeFileInfo);
    expect((component as any).pendingFsFileInfo).toBeUndefined();
  });

  // A file deploy that ended can be deployed again from the overrides step:
  // the deploy step gets the upload deployer on every entry, until the
  // source is chosen again
  it('hands the upload deployer to every entry of the deploy step', async () => {
    const deployer = {};
    const mockStep3 = { onEnter: vi.fn() };
    stubStep('step2_2', { onNext: vi.fn().mockResolvedValue({ success: true, data: deployer }) });
    stubStep('step3', mockStep3);
    await component.step2_2Handle.submit!();

    component.step3Handle.onEnter!();
    // Previous to the overrides, then Next
    component.step3Handle.onEnter!();
    expect(mockStep3.onEnter).toHaveBeenNthCalledWith(2, deployer);

    // Back to the source step, which now saves a git source
    stubStep('step2', { onNext: vi.fn().mockResolvedValue({ success: true, data: undefined }) });
    await component.step2Handle.submit!();
    component.step3Handle.onEnter!();
    expect(mockStep3.onEnter).toHaveBeenLastCalledWith(undefined);
  });

  // Previous from the deploy step leads back to the overrides, whose Next
  // then starts another deploy
  it('labels the overrides Next "Deploy again" once a deploy has started', () => {
    stubStep('step3', { onEnter: vi.fn() });
    expect(component.step4Handle.nextButtonText!()).toBe('Deploy');

    component.step3Handle.onEnter!();
    expect(component.step4Handle.nextButtonText!()).toBe('Deploy again');
  });

  // Regression guard for the "Source Config shows no options / Next disabled"
  // bug. step2_1 (the git commit picker) is rendered via [hidden], so its
  // view query resolves at parent view-init — before step 2 has saved any
  // git source. Building the commit list there (the old `v.onEnter()` at
  // wiring time) ran against an empty applicationSource and never resolved a
  // project/branch. The build must instead happen on step activation via
  // step2_1Handle.onEnter, which the stepper fires after step 2's submit.
  it('builds the commit list on step2_1 activation (handle.onEnter), not when the child is wired', () => {
    const mockStep2_1 = { onEnter: vi.fn(), onLeave: vi.fn(), validate: signal(false) };

    // The view query resolves at parent view-init. Wiring the child must
    // NOT call onEnter here — applicationSource has no git details yet, so
    // the commit list would build empty (the reported bug).
    stubStep('step2_1', mockStep2_1);
    expect(component.step2_1Handle.valid()).toBe(false);
    expect(mockStep2_1.onEnter).not.toHaveBeenCalled();

    // Stepper navigates into Source Config → fires handle.onEnter →
    // the child builds the commit list against the now-populated source.
    component.step2_1Handle.onEnter!();
    expect(mockStep2_1.onEnter).toHaveBeenCalledTimes(1);
  });

  // Steps 2_1 and 3 keep their state in signals; the handles read them
  // straight from the step.
  it('reads the validity of steps 2_1 and 3 from the steps', () => {
    stubStep('step2_1', { validate: signal(true) });
    stubStep('step3', { valid: signal(true), closeable: signal(true), disablePrevious: signal(false) });

    expect(component.step2_1Handle.valid()).toBe(true);
    expect(component.step3Handle.valid()).toBe(true);
    expect(component.step3Handle.canClose!()).toBe(true);
    expect(component.step3Handle.disablePrevious!()).toBe(false);
  });
});

// Stands in for the page header and every wizard step, so the real template
// renders without the steps' own dependencies.
@Component({
  selector: 'app-page-header, app-create-application-step1, app-deploy-application-step2, ' +
    'app-deploy-application-step2-1, app-deploy-application-step-source-upload, ' +
    'app-deploy-application-options-step, app-deploy-application-step3',
  template: '<ng-content></ng-content>',
})
class StubWizardPartComponent {
  validate = new Subject<boolean>();
  sourceTypeGithub = () => undefined;
  sourceTypeNeedsUpload = () => undefined;
  valid$ = new Subject<boolean>();
  onEnter() { }
}

describe('DeployApplicationComponent title', () => {
  const githubEndpoints = signal<unknown[]>([]);

  const render = async (queryParams: Record<string, string>, beforeCreate?: () => void) => {
    TestBed.configureTestingModule({
      imports: [createEmptyStoreModule(), EntityCatalogTestModule, CoreModule, NoopAnimationsModule, DeployApplicationComponent],
      providers: [
        ...STORE_TEST_PROVIDERS,
        { provide: TEST_CATALOGUE_ENTITIES, useValue: [...generateStratosEntities(), ...generateCFEntities()] },
        EntityCatalogHelper,
        provideZonelessChangeDetection(),
        provideRouter([{ path: '**', children: [] }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { params: {}, queryParams } } },
        { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL },
        { provide: EndpointsDataService, useValue: { endpointsList: githubEndpoints, endpoints: signal({}) } },
        { provide: GitSCMService, useValue: { getSCM: () => ({ getType: () => 'github', getPublicApi: () => 'https://api.github.com' }) } },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });
    // Only the heading is under test: render the real template without the wizard steps
    TestBed.overrideComponent(DeployApplicationComponent, { set: { imports: [StubWizardPartComponent] } });
    EntityCatalogHelpers.SetEntityCatalogHelper(TestBed.inject(EntityCatalogHelper));
    beforeCreate?.();
    // Counts how often the title's source is looked up
    const lookUp = ApplicationDeploySourceTypes.prototype.getAutoSelectedType;
    vi.spyOn(ApplicationDeploySourceTypes.prototype, 'getAutoSelectedType').mockImplementation(function (this: ApplicationDeploySourceTypes, route) {
      subscriptions++;
      return lookUp.call(this, route);
    });
    const fixture = TestBed.createComponent(DeployApplicationComponent);
    await fixture.whenStable();
    return fixture;
  };
  let subscriptions = 0;

  const heading = (fixture: ComponentFixture<DeployApplicationComponent>) =>
    (fixture.nativeElement.querySelector('h1')?.textContent ?? '').trim();

  beforeEach(() => {
    githubEndpoints.set([]);
    subscriptions = 0;
  });

  afterEach(() => vi.restoreAllMocks());

  it('shows the source type picked in the link', async () => {
    const fixture = await render({ 'auto-select-deploy': 'github' });
    await fixture.whenStable();
    expect(heading(fixture)).toBe('Deploy from GitHub');
  });

  it('looks the source type up once however often the view is checked', async () => {
    const fixture = await render({ 'auto-select-deploy': 'github' });
    await fixture.whenStable();
    const lookedUp = subscriptions;
    for (let i = 0; i < 3; i++) {
      fixture.componentRef.changeDetectorRef.markForCheck();
      await fixture.whenStable();
    }
    expect(heading(fixture)).toBe('Deploy from GitHub');
    // The title's look-up is a computed: repeated checks do not repeat it
    expect(lookedUp).toBeGreaterThan(0);
    expect(subscriptions).toBe(lookedUp);
  });

  it('titles a redeploy', async () => {
    const fixture = await render({ appGuid: 'app-1' });
    expect(heading(fixture)).toBe('Redeploy');
  });

  // A redeploy opens with the app's CF, org and space already in the
  // deploy state; the pickers follow it.
  it('selects the cf, org and space of a redeploy', async () => {
    const fixture = await render({ appGuid: 'app-1' });
    TestBed.inject(CfDeployAppDataService).setCfDetails({ cloudFoundry: 'cf-1', org: 'org-1', space: 'space-1' });
    await fixture.whenStable();

    const spaces = fixture.componentInstance.cfOrgSpaceService;
    expect([spaces.cf.select(), spaces.org.select(), spaces.space.select()]).toEqual(['cf-1', 'org-1', 'space-1']);
  });

  it('goes to a new deploy when a redeploy has no deploy state', async () => {
    let navigate!: ReturnType<typeof vi.spyOn>;
    await render({ appGuid: 'app-1' }, () => {
      navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    });
    expect(navigate).toHaveBeenCalledWith(['applications', 'deploy']);
  });

  it('skips the commit step for a public git URL', async () => {
    const fixture = await render({});
    const deployData = TestBed.inject(CfDeployAppDataService);
    expect(fixture.componentInstance.skipConfig()).toBe(false);
    deployData.setSourceType({ id: 'giturl', name: 'Public Git URL' } as never);
    expect(fixture.componentInstance.skipConfig()).toBe(true);
  });
});
