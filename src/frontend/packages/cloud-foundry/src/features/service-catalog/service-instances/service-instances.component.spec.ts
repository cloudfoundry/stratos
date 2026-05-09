import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  ConfirmationDialogService,
  TailwindSnackBarService,
} from '@stratosui/core';

import { CfServiceInstancesSignalConfigService } from '../../../shared/components/list/list-types/service-instance/cf-service-instances-signal-config.service';
import { ServiceInstancesComponent } from './service-instances.component';

describe('ServiceInstancesComponent (signal-native)', () => {
  let component: ServiceInstancesComponent;
  let fixture: ComponentFixture<ServiceInstancesComponent>;

  // Stubs the signal config surface the tab consumes — view pipeline,
  // page/sort/filter signals, lifecycle methods. Mirrors the per-app
  // tab spec stubs.
  const makeConfigStub = () => {
    const view = {
      pagedItems: signal<any[]>([]),
      totalFilteredResults: signal(0),
      totalPages: signal(1),
    };
    return {
      orchestrator: { isAnyLoading: signal(false) },
      view,
      pageIndex: signal(0),
      pageSize: signal(25),
      nameFilter: signal(''),
      sort: signal({ field: 'name', direction: 'asc' }),
      viewMode: signal<'card' | 'table'>('card'),
      initializeForOffering: vi.fn(),
      registerSortExtractor: vi.fn(),
      registerFilterExtractor: vi.fn(),
      loadAll: vi.fn(async () => undefined),
      refresh: vi.fn(async () => undefined),
      clearFilters: vi.fn(),
      deleteServiceInstance: vi.fn(async () => undefined),
    };
  };

  let configStub: ReturnType<typeof makeConfigStub>;

  beforeEach(async () => {
    configStub = makeConfigStub();
    await TestBed.configureTestingModule({
      imports: [ServiceInstancesComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: { endpointId: 'cnsi-1', serviceId: 'svc-1' } },
            parent: null,
          },
        },
        { provide: CfServiceInstancesSignalConfigService, useValue: configStub },
        { provide: ConfirmationDialogService, useValue: { open: vi.fn() } },
        { provide: TailwindSnackBarService, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceInstancesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('initializeForOffering(cnsi, serviceGuid) is called on init from route params', () => {
    fixture.detectChanges();
    expect(configStub.initializeForOffering).toHaveBeenCalledWith('cnsi-1', 'svc-1');
  });

  it('builds a SignalListConfig pointing at the offering view pipeline', () => {
    fixture.detectChanges();
    expect(component.listConfig).toBeTruthy();
    expect(component.listConfig!.pagedItems).toBe(configStub.view.pagedItems);
    const keys = component.listConfig!.columns.map(c => c.key);
    expect(keys).toEqual(['name', 'plan', 'lastOp', 'tags', 'createdAt', 'type', 'actions']);
  });

  it('Delete row action opens confirm and on confirm calls deleteServiceInstance', async () => {
    fixture.detectChanges();
    const confirmDialog = TestBed.inject(ConfirmationDialogService) as any;
    const actionsCol = component.listConfig!.columns.find(c => c.key === 'actions') as any;
    const row = { guid: 'si-7', cnsiGuid: 'cnsi-1', name: 'redis-cache' };
    const deleteAction = actionsCol.actions(row).find((a: any) => a.label === 'Delete');
    expect(deleteAction).toBeTruthy();

    deleteAction.invoke();
    expect(confirmDialog.open).toHaveBeenCalledTimes(1);
    const onConfirm = confirmDialog.open.mock.calls[0][1];
    await onConfirm();
    expect(configStub.deleteServiceInstance).toHaveBeenCalledWith('cnsi-1', 'si-7');
  });
});
