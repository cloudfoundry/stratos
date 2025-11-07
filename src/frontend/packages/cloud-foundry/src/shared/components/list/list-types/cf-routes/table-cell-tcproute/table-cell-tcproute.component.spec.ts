import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import {
  BooleanIndicatorComponent,
} from '../../../../../../../../core/src/shared/components/boolean-indicator/boolean-indicator.component';
import { APIResource } from '@stratosui/store/types/api.types';
import { ListCfRoute } from '../cf-routes-data-source-base';
import { TableCellTCPRouteComponent } from './table-cell-tcproute.component';

describe('TableCellTCPRouteComponent', () => {
  let component: TableCellTCPRouteComponent;
  let fixture: ComponentFixture<TableCellTCPRouteComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableCellTCPRouteComponent, BooleanIndicatorComponent],
      providers: [provideZonelessChangeDetection()],
    })
      .compileComponents();

    fixture = TestBed.createComponent(TableCellTCPRouteComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {}
    } as APIResource<ListCfRoute>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
