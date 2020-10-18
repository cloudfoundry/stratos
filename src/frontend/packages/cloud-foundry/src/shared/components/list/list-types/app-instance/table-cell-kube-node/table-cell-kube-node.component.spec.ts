import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseTestModulesNoShared } from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { TableCellKubeNodeComponent } from './table-cell-kube-node.component';

describe('TableCellKubeNodeComponent', () => {
  let component: TableCellKubeNodeComponent;
  let fixture: ComponentFixture<TableCellKubeNodeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCellKubeNodeComponent ],
      imports: [ ...BaseTestModulesNoShared ]
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
