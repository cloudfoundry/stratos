import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TableCellServiceProviderComponent } from './table-cell-service-provider.component';

describe('TableCellServiceProviderComponent', () => {
  let component: TableCellServiceProviderComponent;
  let fixture: ComponentFixture<TableCellServiceProviderComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellServiceProviderComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellServiceProviderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
