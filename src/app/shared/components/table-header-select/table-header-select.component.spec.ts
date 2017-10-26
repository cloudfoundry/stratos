import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableHeaderSelectComponent } from './table-header-select.component';

describe('TableHeaderSelectComponent', () => {
  let component: TableHeaderSelectComponent;
  let fixture: ComponentFixture<TableHeaderSelectComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableHeaderSelectComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableHeaderSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
