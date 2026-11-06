import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  WritableSignal,
  computed,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApplicationService, CloudFoundryService } from '@stratosui/cloud-foundry';
import { ApplicationServiceMock } from '@test-framework/cf';
import {
  ConfirmationDialogConfig,
  ConfirmationDialogService,
  TailwindDialogService,
  TailwindSnackBarService,
} from '@stratosui/core';

import { AppDetailDataService } from '../../../../app-detail-data.service';
import { AppVariableActionsService } from '../../../../../../shared/services/app-variable-actions.service';
import {
  CfAppVariablesSignalConfigService,
} from '../../../../../../shared/signal-list-configs/app-variables/cf-app-variables-signal-config.service';
import { VariableEditDialogComponent } from '../../../../../../shared/components/variable-edit-dialog/variable-edit-dialog.component';
import { VariablesTabComponent } from './variables-tab.component';

describe('VariablesTabComponent', () => {
  let component: VariablesTabComponent;
  let fixture: ComponentFixture<VariablesTabComponent>;

  // Spy holders, refreshed per test.
  let refreshScope: ReturnType<typeof vi.fn>;
  let envVarsSig: WritableSignal<any>;
  let addVariable: ReturnType<typeof vi.fn>;
  let updateVariable: ReturnType<typeof vi.fn>;
  let renameVariable: ReturnType<typeof vi.fn>;
  let deleteVariable: ReturnType<typeof vi.fn>;
  let confirmOpen: ReturnType<typeof vi.fn>;
  let configRefresh: ReturnType<typeof vi.fn>;
  let dialogOpen: ReturnType<typeof vi.fn>;
  let dialogResult: any; // value the stub dialog "closes" with

  /** Minimal AppDetailDataService stub with a settable envVars signal. */
  const makeDataStub = () => {
    refreshScope = vi.fn(async () => undefined);
    envVarsSig = signal<any>(undefined);
    return {
      envVars: envVarsSig.asReadonly(),
      loading: signal({ envVars: false } as any).asReadonly(),
      refresh: refreshScope,
    };
  };

  const makeVariableActionsStub = () => {
    addVariable = vi.fn(async () => undefined);
    updateVariable = vi.fn(async () => undefined);
    renameVariable = vi.fn(async () => undefined);
    deleteVariable = vi.fn(async () => undefined);
    return {
      transitioningName: signal<string | null>(null).asReadonly(),
      inFlight: signal(false).asReadonly(),
      addVariable,
      deleteVariable,
      updateVariable,
      renameVariable,
    };
  };

  const makeVariablesConfigStub = () => {
    const variables: WritableSignal<any[]> = signal([]);
    const filtered = computed(() => variables());
    const view = {
      pagedItems: filtered,
      totalItems: computed(() => variables().length),
      totalFilteredResults: computed(() => filtered().length),
      totalPages: computed(() => 1),
    };
    const pageIndex: WritableSignal<number> = signal(0);
    const pageSize: WritableSignal<number> = signal(25);
    const nameFilter: WritableSignal<string> = signal('');
    const sort: WritableSignal<any> = signal({ field: 'name', direction: 'asc' });
    const viewMode: WritableSignal<'table' | 'card'> = signal('table');
    configRefresh = vi.fn(async () => undefined);
    return {
      view,
      pageIndex,
      pageSize,
      nameFilter,
      sort,
      viewMode,
      variables,
      buildColumns: () => [
        { header: 'Name', key: 'name', render: (r: any) => `${r.name}` },
        { header: 'Value', key: 'value', render: (r: any) => `${r.value}` },
        {
          header: '', key: 'actions', kind: 'actions',
          render: () => '',
          actions: () => [
            { label: 'Delete', invoke: () => Promise.resolve() },
          ],
        } as any,
      ],
      buildRowActions: () => [],
      refresh: configRefresh,
      clearFilters: vi.fn(),
    };
  };

  const makeConfirmStub = () => {
    confirmOpen = vi.fn();
    return { open: confirmOpen };
  };

  const makeDialogStub = () => {
    dialogResult = undefined;
    // of(dialogResult) captures the value set just before invoke().
    dialogOpen = vi.fn(() => ({ afterClosed: () => of(dialogResult) }));
    return { open: dialogOpen };
  };

  const makeSnackStub = () => ({
    open: vi.fn(),
    error: vi.fn(),
  });

  /** Pull the Edit/Delete row actions for a given row off the list config. */
  const rowActionsFor = (row: any) => {
    const actionsCol = component.listConfig.columns.find(c => c.key === 'actions');
    return actionsCol!.actions!(row);
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VariablesTabComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        { provide: CloudFoundryService, useValue: { cFEndpoints$: of([]), connectedCFEndpoints$: of([]) } },
        { provide: AppDetailDataService, useFactory: makeDataStub },
        { provide: ConfirmationDialogService, useFactory: makeConfirmStub },
        { provide: TailwindDialogService, useFactory: makeDialogStub },
        { provide: TailwindSnackBarService, useFactory: makeSnackStub },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
      .overrideComponent(VariablesTabComponent, {
        remove: {
          providers: [AppVariableActionsService, CfAppVariablesSignalConfigService],
        },
        add: {
          providers: [
            { provide: AppVariableActionsService, useFactory: makeVariableActionsStub },
            { provide: CfAppVariablesSignalConfigService, useFactory: makeVariablesConfigStub },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(VariablesTabComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    const httpMock = TestBed.inject(HttpTestingController);
    httpMock.match(() => true);
    if (fixture) {
      try {
        fixture.destroy();
      } catch (_e) {
        // Ignore cleanup errors.
      }
    }
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('envVarNames returns empty array when envVars signal is undefined', () => {
    expect(component.envVarNames()).toEqual([]);
  });

  it('triggers an initial envVars fetch on init', () => {
    fixture.detectChanges();
    expect(refreshScope).toHaveBeenCalledWith('envVars');
  });

  it('builds a signal-list config from the wave-2 service', () => {
    fixture.detectChanges();
    expect(component.listConfig).toBeTruthy();
    const actionsCol = component.listConfig.columns.find(c => c.key === 'actions');
    expect(actionsCol).toBeTruthy();
    expect(actionsCol!.actions).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // Delete — unchanged: confirm dialog then explicit delete + refresh
  // -------------------------------------------------------------------------

  it('opens a confirm dialog before deleting, refreshes on confirm', async () => {
    fixture.detectChanges();
    const del = rowActionsFor({ name: 'FOO', value: 'bar' }).find(a => a.label === 'Delete');
    expect(del).toBeTruthy();

    del!.invoke({ name: 'FOO', value: 'bar' } as any);

    expect(confirmOpen).toHaveBeenCalledTimes(1);
    const [config, onConfirm] = confirmOpen.mock.calls[0];
    expect(config).toBeInstanceOf(ConfirmationDialogConfig);
    expect((config as ConfirmationDialogConfig).message).toContain('FOO');
    expect(deleteVariable).not.toHaveBeenCalled();

    await onConfirm();
    expect(deleteVariable).toHaveBeenCalledWith('FOO');
    expect(configRefresh).toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Editor dialog — Add / Edit / Rename routing
  // -------------------------------------------------------------------------

  it('exposes an Edit row action alongside Delete', () => {
    fixture.detectChanges();
    const actions = rowActionsFor({ name: 'FOO', value: 'bar' });
    expect(actions.find(a => a.label === 'Edit')).toBeTruthy();
    expect(actions.find(a => a.label === 'Delete')).toBeTruthy();
  });

  it('Add button opens the editor dialog in add mode with all existing names', () => {
    envVarsSig.set({ environment: { FOO: 'a', BAR: 'b' } });
    fixture.detectChanges();

    component.addVariableAction.invoke();

    expect(dialogOpen).toHaveBeenCalledTimes(1);
    const [cmp, cfg] = dialogOpen.mock.calls[0];
    expect(cmp).toBe(VariableEditDialogComponent);
    expect(cfg.data.mode).toBe('add');
    expect(cfg.data.existingNames).toEqual(['FOO', 'BAR']);
  });

  it('Edit row action opens the dialog pre-filled, existingNames excluding self', () => {
    envVarsSig.set({ environment: { FOO: 'a', BAR: 'b' } });
    fixture.detectChanges();

    const edit = rowActionsFor({ name: 'FOO', value: 'a' }).find(a => a.label === 'Edit');
    edit!.invoke({ name: 'FOO', value: 'a' } as any);

    const [, cfg] = dialogOpen.mock.calls[0];
    expect(cfg.data.mode).toBe('edit');
    expect(cfg.data.name).toBe('FOO');
    expect(cfg.data.value).toBe('a');
    expect(cfg.data.existingNames).toEqual(['BAR']); // self excluded
  });

  it('add result routes to addVariable then refreshes', async () => {
    fixture.detectChanges();
    dialogResult = { name: 'NEW', value: 'v' };

    component.addVariableAction.invoke();
    await Promise.resolve();
    await Promise.resolve();

    expect(addVariable).toHaveBeenCalledWith('NEW', 'v');
    expect(configRefresh).toHaveBeenCalled();
  });

  it('edit result with unchanged name routes to updateVariable', async () => {
    envVarsSig.set({ environment: { FOO: 'a' } });
    fixture.detectChanges();
    dialogResult = { name: 'FOO', value: 'changed' };

    rowActionsFor({ name: 'FOO', value: 'a' }).find(a => a.label === 'Edit')!.invoke({ name: 'FOO', value: 'a' } as any);
    await Promise.resolve();
    await Promise.resolve();

    expect(updateVariable).toHaveBeenCalledWith('FOO', 'changed');
    expect(renameVariable).not.toHaveBeenCalled();
    expect(configRefresh).toHaveBeenCalled();
  });

  it('edit result with a changed name routes to renameVariable (old -> new)', async () => {
    envVarsSig.set({ environment: { FOO: 'a' } });
    fixture.detectChanges();
    dialogResult = { name: 'RENAMED', value: 'a' };

    rowActionsFor({ name: 'FOO', value: 'a' }).find(a => a.label === 'Edit')!.invoke({ name: 'FOO', value: 'a' } as any);
    await Promise.resolve();
    await Promise.resolve();

    expect(renameVariable).toHaveBeenCalledWith('FOO', 'RENAMED', 'a');
    expect(updateVariable).not.toHaveBeenCalled();
    expect(configRefresh).toHaveBeenCalled();
  });

  it('cancelling the dialog (no result) performs no action service call', async () => {
    fixture.detectChanges();
    dialogResult = undefined; // cancelled

    component.addVariableAction.invoke();
    await Promise.resolve();
    await Promise.resolve();

    expect(addVariable).not.toHaveBeenCalled();
    expect(updateVariable).not.toHaveBeenCalled();
    expect(renameVariable).not.toHaveBeenCalled();
  });

  it('surfaces a snackbar error when the action service rejects', async () => {
    fixture.detectChanges();
    dialogResult = { name: 'NEW', value: 'v' };
    addVariable.mockRejectedValueOnce(new Error('CF-Boom'));
    const snack = TestBed.inject(TailwindSnackBarService) as any;

    component.addVariableAction.invoke();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(snack.error).toHaveBeenCalled();
  });

  describe('value masking (list rows)', () => {
    it('masks a sensitive row until revealed, and re-masks on toggle', () => {
      const row = { name: 'CLIENT_SECRET', value: 's3cr3t' };
      expect(component.rowField(row).sensitive).toBe(true);
      expect(component.rowDisplay(row)).toBe('••••••••');

      component.toggleRowReveal(row);
      expect(component.rowRevealed(row)).toBe(true);
      expect(component.rowDisplay(row)).toBe('s3cr3t');

      component.toggleRowReveal(row);
      expect(component.rowDisplay(row)).toBe('••••••••');
    });

    it('redacts only the password of an embedded-credential value', () => {
      const row = { name: 'DATABASE_URL', value: 'postgres://u:pw@db/x' };
      expect(component.rowField(row).sensitive).toBe(true);
      expect(component.rowDisplay(row)).toBe('postgres://u:<redacted>@db/x');
    });

    it('shows a non-sensitive row plainly', () => {
      const row = { name: 'PORT', value: '8080' };
      expect(component.rowField(row).sensitive).toBe(false);
      expect(component.rowDisplay(row)).toBe('8080');
    });
  });

  describe('All Variables masking', () => {
    const displayRows = () => component.allEnvVarsDisplay().filter(r => !r.section);
    const valueOf = (name: string) => displayRows().find(r => r.name === name)!.value;

    it('deep-masks sensitive values by default and reveals on Show secrets', () => {
      envVarsSig.set({
        environment: { DB_PASSWORD: 'pw', PORT: '8080' },
        systemProvided: {
          VCAP_SERVICES: { 'my-db': [{ credentials: { hostname: 'db.local', password: 'pw' } }] },
        },
      });

      expect(valueOf('DB_PASSWORD')).toBe('••••••••');
      expect(valueOf('PORT')).toBe('8080');
      const vcap = valueOf('VCAP_SERVICES') as any;
      expect(vcap['my-db'][0].credentials.password).toBe('••••••••');
      expect(vcap['my-db'][0].credentials.hostname).toBe('db.local');

      component.showAllSecrets.set(true);
      expect(valueOf('DB_PASSWORD')).toBe('pw');
      expect((valueOf('VCAP_SERVICES') as any)['my-db'][0].credentials.password).toBe('pw');
    });

    it('leaves section header rows untouched', () => {
      envVarsSig.set({ environment: { DB_PASSWORD: 'pw' } });
      const sections = component.allEnvVarsDisplay().filter(r => r.section);
      expect(sections.length).toBe(1);
      expect(sections[0].name).toBe('environment');
    });
  });
});
