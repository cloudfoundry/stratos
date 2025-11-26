import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { ValuesPipe } from '@stratosui/core';
import type { APIResource } from '@stratosui/store';
import type { CfEvent } from '../../../../../../cf-api.types';
import { EventMetadataComponent } from '../event-metadata/event-metadata.component';
import { TableCellEventDetailComponent } from './table-cell-event-detail.component';

describe('TableCellEventDetailComponent', () => {
  let component: TableCellEventDetailComponent;
  let fixture: ComponentFixture<TableCellEventDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableCellEventDetailComponent, ValuesPipe, EventMetadataComponent],
      providers: [provideZonelessChangeDetection()],
    })
      .compileComponents();

    fixture = TestBed.createComponent<TableCellEventDetailComponent>(TableCellEventDetailComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {
        metadata: {}
      }
    } as APIResource<CfEvent>;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
