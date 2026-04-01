import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { createBasicStoreModule } from '@stratosui/store/testing';
import { APIResource } from '@stratosui/store/types/api.types';

import { IQuotaDefinition } from '../../../../../../cf-api.types';
import { TableCellQuotaComponent } from './table-cell-quota.component';

describe('TableCellQuotaComponent', () => {
  let component: TableCellQuotaComponent;
  let fixture: ComponentFixture<TableCellQuotaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TableCellQuotaComponent,
        RouterTestingModule,
        createBasicStoreModule(),
      ],
      providers: [provideZonelessChangeDetection()],
    })
      .compileComponents();

    fixture = TestBed.createComponent(TableCellQuotaComponent);
    component = fixture.componentInstance;
    component.config = {
      baseUrl: [
        '/cloud-foundry',
        'cfGuid',
        'organizations',
        'orgGuid',
        'space-quota-definitions'
      ]
    };
    component.row = {
      metadata: {
        guid: '',
      },
      entity: {
        guid: '',
        name: 'test0',
        memory_limit: 1000,
        app_instance_limit: -1,
        instance_memory_limit: -1,
        total_services: -1,
        total_routes: -1,
      }
    } as APIResource<IQuotaDefinition>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
