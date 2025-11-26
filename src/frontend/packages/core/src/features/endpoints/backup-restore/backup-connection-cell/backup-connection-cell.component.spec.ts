import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import type { EndpointModel } from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { BaseTestModulesNoShared, BASE_TEST_PROVIDERS } from "@test-framework/core-test.helper";
import { BackupEndpointsService } from '../backup-endpoints.service';
import { BackupConnectionCellComponent } from './backup-connection-cell.component';

describe('BackupConnectionCellComponent', () => {
  let component: BackupConnectionCellComponent;
  let fixture: ComponentFixture<BackupConnectionCellComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...BaseTestModulesNoShared,
        BackupConnectionCellComponent,
      ],
      providers: [
        ...BASE_TEST_PROVIDERS,
        ...(STORE_TEST_PROVIDERS || []),
        BackupEndpointsService,
        provideZonelessChangeDetection(),
      ]
    });
    TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BackupConnectionCellComponent);
    component = fixture.componentInstance;
    component.row = {
      guid: 'test',
      cnsi_type: 'metrics',
    } as EndpointModel;
    component.service.initialize([{
      guid: 'test'
    } as EndpointModel]);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
