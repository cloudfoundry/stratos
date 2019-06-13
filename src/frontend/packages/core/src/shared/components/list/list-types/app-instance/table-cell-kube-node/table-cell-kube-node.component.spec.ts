import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellKubeNodeComponent } from './table-cell-kube-node.component';

describe('TableCellKubeNodeComponent', () => {
  let component: TableCellKubeNodeComponent;
  let fixture: ComponentFixture<TableCellKubeNodeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCellKubeNodeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellKubeNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
