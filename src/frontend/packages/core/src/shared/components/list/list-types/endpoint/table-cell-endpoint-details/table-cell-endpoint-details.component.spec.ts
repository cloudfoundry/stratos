import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { BaseTestModules } from '@test-framework/core-test.helper';
import { EndpointListHelper } from '../../../../endpoint-list/endpoint-list.helpers';
import { TableCellEndpointDetailsComponent } from './table-cell-endpoint-details.component';

describe('TableCellEndpointDetailsComponent', () => {
  let component: TableCellEndpointDetailsComponent;
  let fixture: ComponentFixture<TableCellEndpointDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TableCellEndpointDetailsComponent,
        ...BaseTestModules
      ],
      providers: [
        EndpointListHelper
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellEndpointDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
