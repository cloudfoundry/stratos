import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, computed, inject, provideZonelessChangeDetection, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { CdkPortalOutlet } from '@angular/cdk/portal';
import { describe, it, expect, vi } from 'vitest';
import { BehaviorSubject } from 'rxjs';

import {
  ApplicationServiceMock,
  makeAppDetailDataServiceStub,
  generateCfStoreModules,
  ApplicationStateService,
  ApplicationEnvVarsHelper,
} from '@test-framework/cf';
import { ApplicationService } from '@stratosui/cloud-foundry';
import { AppDetailDataService } from '../../../features/applications/app-detail-data.service';
import { CurrentUserPermissionsService, TabNavService } from '@stratosui/core';

import { AppApplicationActionsService } from '../../services/application-actions.service';
import { AppLifecycleProgressService } from '../app-lifecycle-progress/app-lifecycle-progress.service';
import { AppApplicationActionBarComponent } from './application-action-bar.component';

/**
 * Host component for the action-bar tests.
 *
 * AppApplicationActionBarComponent renders its content through a
 * <app-page-sub-nav> which uses a CDK TemplatePortal published via
 * TabNavService.setSubNav(). In production a portal outlet in dashboard-base
 * mounts that portal so the buttons appear in the page header. In tests we
 * mount our own CdkPortalOutlet bound to TabNavService.tabSubNav so the
 * projected template renders into the fixture DOM and we can assert on it.
 */
@Component({
  selector: 'app-action-bar-test-host',
  standalone: true,
  imports: [CommonModule, CdkPortalOutlet, AppApplicationActionBarComponent],
  template: `
    <app-application-action-bar></app-application-action-bar>
    <div data-test-id="portal-outlet">
      @if (portal$ | async; as portal) {
        <ng-container [cdkPortalOutlet]="portal"></ng-container>
      }
    </div>
  `,
})
class ActionBarTestHostComponent {
  portal$ = inject(TabNavService).tabSubNav$;
}

describe('AppApplicationActionBarComponent', () => {
  let fixture: ComponentFixture<ActionBarTestHostComponent>;
  let applicationServiceMock: ApplicationServiceMock;

  /**
   * Build the test bed with optional overrides applied to the detail
   * service stub so each test can shape the app state, URL and running
   * flag independently.
   */
  async function setUp(
    overrides: {
      state?: any;
      url?: string | null;
      running?: boolean;
      inFlight?: boolean;
    } = {}
  ) {
    applicationServiceMock = new ApplicationServiceMock();
    // Bypass waitForCFPermissions in the *appCfUserPermission directive: when
    // endpointGuid is empty the directive resolves to observableOf(true) and
    // we don't need to seed CF role state into the test store.
    (applicationServiceMock as any).cfGuid = '';

    const detailStub = {
      ...makeAppDetailDataServiceStub(),
      // The permission-gated block needs the space.
      space: signal({ guid: 'mockSpaceGuid', name: 'mockSpace' } as any).asReadonly(),
      state: computed(() => overrides.state ?? { label: '', indicator: null, actions: null }),
      url: computed(() => overrides.url ?? null),
      running: computed(() => overrides.running ?? false),
    };

    // Mock action methods so click handlers don't trigger real navigation/dispatch.
    // The component reads `actions.inFlight` as a readonly Signal and pipes it
    // through toObservable() — the mock must expose a real Signal here, not
    // just a value, or toObservable will throw "source is not a function".
    const actionsMock = {
      inFlight: signal(overrides.inFlight ?? false).asReadonly(),
      restart: () => {},
      stop: () => {},
      start: () => {},
      restage: () => {},
      redirectToDelete: () => {},
    };

    // Force *appCfUserPermission to render its template by saying "yes" to all
    // permission checks. The directive subscribes to can() and only renders
    // when the observable emits true.
    const permissionsMock = {
      can: vi.fn().mockReturnValue(new BehaviorSubject<boolean>(true).asObservable()),
    };

    await TestBed.configureTestingModule({
      imports: [
        ActionBarTestHostComponent,
        ...generateCfStoreModules(),
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ApplicationService, useValue: applicationServiceMock },
        { provide: AppDetailDataService, useValue: detailStub },
        { provide: AppApplicationActionsService, useValue: actionsMock },
        { provide: AppLifecycleProgressService, useValue: { setAnchor: vi.fn() } },
        { provide: CurrentUserPermissionsService, useValue: permissionsMock },
        ApplicationStateService,
        ApplicationEnvVarsHelper,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ActionBarTestHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  // #6126: every application tab offers the CF CLI menu beside the actions.
  it('offers the CF CLI menu, with CF CLI All leading to the application\'s CLI page', async () => {
    await setUp({
      state: {
        label: 'Running', indicator: null, actions: { restart: true, stop: true, start: false, restage: true },
      },
    });

    const root: HTMLElement = fixture.nativeElement;
    const trigger = root.querySelector('button[aria-label="CF CLI"]') as HTMLButtonElement;
    expect(trigger).toBeTruthy();
    trigger.click();
    await fixture.whenStable();
    const all = root.querySelector('a[role="menuitem"]') as HTMLAnchorElement;
    expect(all?.textContent).toContain('CF CLI All');
    // setUp blanks the mock's cfGuid for the permission directive, so only the tail is fixed.
    expect(all.getAttribute('href')).toMatch(/^\/applications\/.*\/mockAppGuid\/cli$/);
  });

  it('renders restart/stop/restage buttons when app is started', async () => {
    await setUp({
      state: {
        label: 'Running',
        indicator: null,
        actions: { restart: true, stop: true, start: false, restage: true },
      },
    });

    const root: HTMLElement = fixture.nativeElement;
    const restartBtn = root.querySelector('button[name="restart"]');
    const stopBtn = root.querySelector('button[name="stop"]');
    const restageBtn = root.querySelector('button[name="restage"]');
    const startBtn = root.querySelector('button[name="start"]');

    expect(restartBtn).toBeTruthy();
    expect(stopBtn).toBeTruthy();
    expect(restageBtn).toBeTruthy();
    // Stop is shown via @if/@else, so start must not appear
    expect(startBtn).toBeFalsy();
  });

  it('renders start button when app is stopped', async () => {
    await setUp({
      state: {
        label: 'Stopped',
        indicator: null,
        actions: { restart: false, stop: false, start: true, restage: false },
      },
    });

    const root: HTMLElement = fixture.nativeElement;
    const startBtn = root.querySelector('button[name="start"]');
    const stopBtn = root.querySelector('button[name="stop"]');

    expect(startBtn).toBeTruthy();
    expect(stopBtn).toBeFalsy();
  });

  it('disables action buttons when actions.inFlight is true', async () => {
    // Busy state used to come from ngrx updatingSection$.restaging; the
    // action service now owns its own inFlight signal so external state
    // can never strand the buttons. The test drives the new signal
    // directly.
    await setUp({
      state: {
        label: 'Running',
        indicator: null,
        actions: { restart: true, stop: true, start: false, restage: true },
      },
      inFlight: true,
    });

    const root: HTMLElement = fixture.nativeElement;
    const restartBtn = root.querySelector('button[name="restart"]') as HTMLButtonElement;
    const stopBtn = root.querySelector('button[name="stop"]') as HTMLButtonElement;
    const restageBtn = root.querySelector('button[name="restage"]') as HTMLButtonElement;

    expect(restartBtn?.disabled).toBe(true);
    expect(stopBtn?.disabled).toBe(true);
    expect(restageBtn?.disabled).toBe(true);
  });

  it('enables Visit only for a started app with a route', async () => {
    await setUp({ url: 'https://app.example.test', running: true });
    const visit = fixture.nativeElement.querySelector('a[aria-label="Visit"]') as HTMLAnchorElement;
    expect(visit.getAttribute('href')).toBe('https://app.example.test');
    expect(visit.classList.contains('pointer-events-none')).toBe(false);
  });

  it('disables Visit while the app is stopped', async () => {
    await setUp({ url: 'https://app.example.test', running: false });
    const visit = fixture.nativeElement.querySelector('a[aria-label="Visit"]') as HTMLAnchorElement;
    expect(visit.classList.contains('pointer-events-none')).toBe(true);
  });
});
