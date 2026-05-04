import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal, computed, WritableSignal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, expect, vi } from 'vitest';

import { ConfirmationDialogService, CurrentUserPermissionsService, TailwindSnackBarService } from '@stratosui/core';

import { CardAppInstancesComponent } from './card-app-instances.component';
import { ApplicationService } from '../../../../features/applications/application.service';
import { AppDetailDataService } from '../../../../features/applications/app-detail-data.service';
import { CfAppsSignalConfigService } from '../../list/list-types/app/cf-apps-signal-config.service';

interface DataStubOpts {
  desired?: number;
  running?: number;
  total?: number;
  appState?: string;
  loadingApp?: boolean;
}

function makeDataStub(opts: DataStubOpts = {}) {
  const desired = opts.desired ?? 2;
  const runningN = opts.running ?? 2;
  const totalN = opts.total ?? runningN;
  const stateLabel = opts.appState ?? 'STARTED';

  const stats = Array.from({ length: totalN }, (_, i) => ({
    state: i < runningN ? 'RUNNING' : 'CRASHED',
  }));

  const appSig: WritableSignal<any> = signal({ entity: { state: stateLabel, instances: desired } });
  const statsSig: WritableSignal<any[]> = signal(stats);
  const loadingSig: WritableSignal<{ app: boolean }> = signal({ app: opts.loadingApp ?? false });

  return {
    app: appSig.asReadonly(),
    stats: statsSig.asReadonly(),
    state: computed(() => ({ label: stateLabel, indicator: null, actions: {} })),
    running: computed(() => stateLabel === 'STARTED'),
    loading: loadingSig.asReadonly(),
    // Writable refs for tests to mutate.
    _appSig: appSig,
    _statsSig: statsSig,
    _loadingSig: loadingSig,
  };
}

function makeAppServiceStub() {
  return {
    cfGuid: 'cf-1',
    appGuid: 'app-1',
    appOrg$: of({ metadata: { guid: 'org-1' } }),
    appSpace$: of({ metadata: { guid: 'space-1' } }),
  };
}

function makeAppsStub() {
  return {
    scaleApp: vi.fn().mockResolvedValue(undefined),
  };
}

function makeCupsStub(canResult = true) {
  return {
    can: vi.fn().mockReturnValue(of(canResult)),
  };
}

function setup(opts: DataStubOpts & { showActions?: boolean; canEdit?: boolean } = {}) {
  const dataStub = makeDataStub(opts);
  const appStub = makeAppServiceStub();
  const appsStub = makeAppsStub();
  const cupsStub = makeCupsStub(opts.canEdit ?? true);
  const confirmStub = { open: vi.fn((_cfg: any, fn: () => void) => fn()) };
  const snackStub = { open: vi.fn() };

  TestBed.configureTestingModule({
    imports: [CardAppInstancesComponent],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: AppDetailDataService, useValue: dataStub },
      { provide: ApplicationService, useValue: appStub },
      { provide: CfAppsSignalConfigService, useValue: appsStub },
      { provide: CurrentUserPermissionsService, useValue: cupsStub },
      { provide: ConfirmationDialogService, useValue: confirmStub },
      { provide: TailwindSnackBarService, useValue: snackStub },
    ],
  });

  const fixture: ComponentFixture<CardAppInstancesComponent> = TestBed.createComponent(CardAppInstancesComponent);
  fixture.componentRef.setInput('showActions', opts.showActions ?? false);
  fixture.detectChanges();
  return { fixture, dataStub, appStub, appsStub, cupsStub, confirmStub, snackStub };
}

describe('CardAppInstancesComponent', () => {
  it('creates', () => {
    const { fixture } = setup();
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('counts', () => {
    it('reads runningCount and desiredCount from signals', () => {
      const { fixture } = setup({ desired: 3, running: 2, total: 3 });
      const c = fixture.componentInstance;
      expect(c.runningCount()).toBe(2);
      expect(c.desiredCount()).toBe(3);
    });

    it('renders "running / desired" when not editing', () => {
      const { fixture } = setup({ desired: 3, running: 1, total: 3 });
      const html: string = fixture.nativeElement.innerHTML;
      expect(html).toContain('1 / 3');
    });

    it('reactively updates when stats change', () => {
      const { fixture, dataStub } = setup({ desired: 2, running: 0, total: 2 });
      expect(fixture.componentInstance.runningCount()).toBe(0);
      dataStub._statsSig.set([{ state: 'RUNNING' }, { state: 'RUNNING' }]);
      expect(fixture.componentInstance.runningCount()).toBe(2);
    });

    it('reactively updates desiredCount when app entity changes', () => {
      const { fixture, dataStub } = setup({ desired: 2 });
      expect(fixture.componentInstance.desiredCount()).toBe(2);
      dataStub._appSig.set({ entity: { state: 'STARTED', instances: 5 } });
      expect(fixture.componentInstance.desiredCount()).toBe(5);
    });

    it('returns 0 desired when app entity is null', () => {
      const { fixture, dataStub } = setup();
      dataStub._appSig.set(null);
      expect(fixture.componentInstance.desiredCount()).toBe(0);
    });

    it('returns 0 running when stats are empty', () => {
      const { fixture, dataStub } = setup();
      dataStub._statsSig.set([]);
      expect(fixture.componentInstance.runningCount()).toBe(0);
    });
  });

  describe('actions row visibility', () => {
    it('hides actions when showActions=false', () => {
      const { fixture } = setup({ showActions: false });
      const buttons = fixture.nativeElement.querySelectorAll('button');
      expect(buttons.length).toBe(0);
    });

    it('renders edit/scaleDown/scaleUp when showActions=true and app is running', () => {
      const { fixture } = setup({ showActions: true, appState: 'STARTED' });
      const html: string = fixture.nativeElement.innerHTML;
      expect(html).toContain('edit');
      expect(html).toContain('remove_circle_outline');
      expect(html).toContain('add_circle_outline');
    });

    it('hides scale buttons when app is stopped', () => {
      const { fixture } = setup({ showActions: true, appState: 'STOPPED' });
      const html: string = fixture.nativeElement.innerHTML;
      expect(html).not.toContain('add_circle_outline');
    });

    it('hides actions when canEdit is false', () => {
      const { fixture } = setup({ showActions: true, canEdit: false });
      const buttons = fixture.nativeElement.querySelectorAll('button');
      expect(buttons.length).toBe(0);
    });
  });

  describe('button disabled state', () => {
    it('disables scale buttons while loading.app is true', () => {
      const { fixture } = setup({ showActions: true, loadingApp: true });
      const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
      expect(buttons.length).toBeGreaterThan(0);
      for (const b of buttons) {
        expect(b.disabled).toBe(true);
      }
    });

    it('enables scale buttons when not loading', () => {
      const { fixture } = setup({ showActions: true, loadingApp: false });
      const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
      expect(buttons.length).toBeGreaterThan(0);
      for (const b of buttons) {
        expect(b.disabled).toBe(false);
      }
    });
  });

  describe('scale actions', () => {
    it('scaleUp invokes apps.scaleApp with desired+1', () => {
      const { fixture, appsStub } = setup({ showActions: true, desired: 2 });
      fixture.componentInstance.scaleUp();
      expect(appsStub.scaleApp).toHaveBeenCalledWith('cf-1', 'app-1', { instances: 3 });
    });

    it('scaleDown invokes apps.scaleApp with desired-1', () => {
      const { fixture, appsStub } = setup({ showActions: true, desired: 3 });
      fixture.componentInstance.scaleDown();
      expect(appsStub.scaleApp).toHaveBeenCalledWith('cf-1', 'app-1', { instances: 2 });
    });

    it('opens the confirm dialog when scaling to zero', () => {
      const { fixture, confirmStub, appsStub } = setup({ showActions: true, desired: 1 });
      fixture.componentInstance.scaleDown();
      expect(confirmStub.open).toHaveBeenCalled();
      // confirm stub auto-confirms, so scaleApp also fires
      expect(appsStub.scaleApp).toHaveBeenCalledWith('cf-1', 'app-1', { instances: 0 });
    });
  });

  describe('edit flow', () => {
    it('edit() sets editValue from desiredCount and switches to editing', () => {
      const { fixture } = setup({ showActions: true, desired: 4 });
      fixture.componentInstance.edit();
      expect(fixture.componentInstance.isEditing).toBe(true);
      expect(fixture.componentInstance.editValue).toBe(4);
    });

    it('finishEdit(true) commits the edited value', () => {
      const { fixture, appsStub } = setup({ showActions: true, desired: 2 });
      const c = fixture.componentInstance;
      c.edit();
      c.editValue = '7';
      c.finishEdit(true);
      expect(c.isEditing).toBe(false);
      expect(appsStub.scaleApp).toHaveBeenCalledWith('cf-1', 'app-1', { instances: 7 });
    });

    it('finishEdit(false) discards the edit', () => {
      const { fixture, appsStub } = setup({ showActions: true });
      const c = fixture.componentInstance;
      c.edit();
      c.editValue = '99';
      c.finishEdit(false);
      expect(c.isEditing).toBe(false);
      expect(appsStub.scaleApp).not.toHaveBeenCalled();
    });
  });
});
