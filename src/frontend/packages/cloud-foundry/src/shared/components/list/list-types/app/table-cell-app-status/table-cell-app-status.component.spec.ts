import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { StoreModule } from '@ngrx/store';

import {
  ApplicationStateIconComponent,
} from '@stratosui/core';
import {
  ApplicationStateIconPipe,
} from '@stratosui/core';
import {
  ApplicationStateComponent,
} from '@stratosui/core';
import { PaginationMonitorFactory, type APIResource } from '@stratosui/store';
import { generateCfStoreModules } from "@test-framework/cloud-foundry-endpoint-service.helper";
import type { IApp } from '../../../../../../cf-api.types';
import { ApplicationStateService } from '../../../../../services/application-state.service';
import { TableCellAppStatusComponent } from "./table-cell-app-status.component";
describe('TableCellAppStatusComponent', () => {
  let component: TableCellAppStatusComponent;
  let fixture: ComponentFixture<TableCellAppStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TableCellAppStatusComponent,
        ApplicationStateComponent,
        ApplicationStateIconComponent,
        ApplicationStateIconPipe,
        StoreModule,
        ...generateCfStoreModules(),
      ],
      providers: [
        ApplicationStateService,
        PaginationMonitorFactory,
        provideZonelessChangeDetection(),
      ],
    })
      .compileComponents();

    fixture = TestBed.createComponent(TableCellAppStatusComponent);
    component = fixture.componentInstance;
    component.row = { entity: {}, metadata: {} } as APIResource<IApp>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
