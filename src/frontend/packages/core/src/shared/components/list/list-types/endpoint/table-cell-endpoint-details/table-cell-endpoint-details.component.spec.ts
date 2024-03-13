import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { BaseTestModules } from '../../../../../../../test-framework/core-test.helper';
import { EndpointListHelper } from '../endpoint-list.helpers';
import { TableCellEndpointDetailsComponent } from './table-cell-endpoint-details.component';

describe('TableCellEndpointDetailsComponent', () => {
  let component: TableCellEndpointDetailsComponent;
  let fixture: ComponentFixture<TableCellEndpointDetailsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [],
      imports: [...BaseTestModules],
      providers: [EndpointListHelper]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellEndpointDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
