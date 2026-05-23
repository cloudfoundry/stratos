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
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PaginationMonitorFactory } from '@stratosui/store';
import { ApplicationService, CloudFoundryService } from '@stratosui/cloud-foundry';
import { ApplicationServiceMock } from '@test-framework/cf';
import {
  ConfirmationDialogConfig,
  ConfirmationDialogService,
  TailwindSnackBarService,
} from '@stratosui/core';

import { AppDetailDataService } from '../../../../app-detail-data.service';
import { AppVariableActionsService } from '../../../../../../shared/services/app-variable-actions.service';
import {
  CfAppVariablesSignalConfigService,
} from '../../../../../../shared/components/list/list-types/app-variables/cf-app-variables-signal-config.service';
import { VariablesTabComponent } from './variables-tab.component';

describe('VariablesTabComponent', () => {
  let component: VariablesTabComponent;
  let fixture: ComponentFixture<VariablesTabComponent>;

  const mockStore = {
    dispatch: vi.fn(),
    select: vi.fn(() => of({})),
    pipe: vi.fn(() => of({})),
  };

  const mockPmf = {
    create: vi.fn(() => ({
      currentPage$: of([]),
      pagination$: of({}),
      fetchingCurrentPage$: of(false),
      isLoadingPage$: of(false),
    })),
  };

  // Spy holders, refreshed per test.
  let refreshScope: ReturnType<typeof vi.fn>;
  let addVariable: ReturnType<typeof vi.fn>;
  let deleteVariable: ReturnType<typeof vi.fn>;
  let confirmOpen: ReturnType<typeof vi.fn>;
  let configRefresh: ReturnType<typeof vi.fn>;

  /** Minimal AppDetailDataService stub. */
  const makeDataStub = () => {
    refreshScope = vi.fn(async () => undefined);
    return {
      envVars: signal<any>(undefined).asReadonly(),
      loading: signal({ envVars: false } as any).asReadonly(),
      refresh: refreshScope,
    };
  };

  const makeVariableActionsStub = () => {
    addVariable = vi.fn(async () => undefined);
    deleteVariable = vi.fn(async () => undefined);
    return {
      transitioningName: signal<string | null>(null).asReadonly(),
      inFlight: signal(false).asReadonly(),
      addVariable,
      deleteVariable,
      updateVariable: vi.fn(async () => undefined),
    };
  };

  // Stub for the tab's signal-list config service. Mirrors the public
  // surface the tab consumes (view pipeline, page/sort signals, columns,
  // refresh/clear). The `actions` column carries an unwrapped invoke
  // that the tab replaces with a confirm-wrapped factory.
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

  const makeSnackStub = () => ({
    open: vi.fn(),
    error: vi.fn(),
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VariablesTabComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: Store, useValue: mockStore },
        { provide: PaginationMonitorFactory, useValue: mockPmf },
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        { provide: CloudFoundryService, useValue: { cFEndpoints$: of([]), connectedCFEndpoints$: of([]) } },
        { provide: AppDetailDataService, useFactory: makeDataStub },
        { provide: ConfirmationDialogService, useFactory: makeConfirmStub },
        { provide: TailwindSnackBarService, useFactory: makeSnackStub },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
      .overrideComponent(VariablesTabComponent, {
        // Replace the heavy tab-scoped providers with stubs so we can
        // observe lifecycle calls without booting the real services
        // (which would pull in HttpClient, ListStateStore, etc.).
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
    expect(component.listConfig.pagedItems).toBeTruthy();
    // Actions column carries the tab's confirm-wrapped factory, not the
    // service's no-confirm one.
    const actionsCol = component.listConfig.columns.find(c => c.key === 'actions');
    expect(actionsCol).toBeTruthy();
    expect(actionsCol!.actions).toBeTruthy();
  });

  it('opens a confirm dialog before deleting, refreshes on confirm', async () => {
    fixture.detectChanges();
    const actionsCol = component.listConfig.columns.find(c => c.key === 'actions');
    const rowActions = actionsCol!.actions!({ name: 'FOO', value: 'bar' } as any);
    const del = rowActions.find(a => a.label === 'Delete');
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

  describe('validateAndSave()', () => {
    it('flags Name is required when the name is empty', () => {
      component.addItem.set({ name: '', value: '' });
      component.validateAndSave();
      expect(component.nameError()).toBe('Name is required');
    });

    it('flags Name is required when the name is whitespace-only', () => {
      component.addItem.set({ name: '   ', value: '' });
      component.validateAndSave();
      expect(component.nameError()).toBe('Name is required');
    });

    it('flags an invalid pattern when the name contains spaces', () => {
      component.addItem.set({ name: 'bad name', value: '' });
      component.validateAndSave();
      expect(component.nameError()).toMatch(/letters, digits, and underscores/i);
    });

    it('flags an invalid pattern when the name starts with a digit', () => {
      component.addItem.set({ name: '1FOO', value: '' });
      component.validateAndSave();
      expect(component.nameError()).toMatch(/letters, digits, and underscores/i);
    });

    it('accepts a valid name and clears any prior error', () => {
      component.nameError.set('Name is required');
      component.addItem.set({ name: 'MY_VAR', value: 'val' });
      component.validateAndSave();
      expect(component.nameError()).toBe('');
    });
  });

  describe('clearNameError()', () => {
    it('resets the error signal when called', () => {
      component.nameError.set('Name is required');
      component.clearNameError();
      expect(component.nameError()).toBe('');
    });
  });
});
