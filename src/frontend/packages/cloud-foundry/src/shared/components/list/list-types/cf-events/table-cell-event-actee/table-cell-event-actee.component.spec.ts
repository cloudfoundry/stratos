import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import type { APIResource } from '@stratosui/store';
import type { CfEvent } from '../../../../../../cf-api.types';

import { TableCellEventActeeComponent } from './table-cell-event-actee.component';

describe('TableCellEventActeeComponent', () => {
  let component: TableCellEventActeeComponent;
  let fixture: ComponentFixture<TableCellEventActeeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableCellEventActeeComponent],
      providers: [provideZonelessChangeDetection()],
    })
      .compileComponents();

    fixture = TestBed.createComponent(TableCellEventActeeComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {
        type: 'test',
        actor: 'test-actor',
        actor_type: 'test-actor-type',
        actor_name: 'test-actor-name',
        actee: 'test-actee',
        actee_type: 'test-actee-type',
        actee_name: 'test-actee-name',
        timestamp: '2023-01-01T00:00:00Z',
        metadata: {}
      },
      metadata: {
        guid: 'test-guid',
        url: '/v2/events/test-guid',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }
    } as APIResource<CfEvent>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
