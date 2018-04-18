import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseTestModulesNoShared } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { TableCellCommitParentsComponent } from './table-cell-commit-parents.component';

describe('TableCellCommitParentsComponent', () => {
  let component: TableCellCommitParentsComponent<any>;
  let fixture: ComponentFixture<TableCellCommitParentsComponent<any>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellCommitParentsComponent],
      imports: [...BaseTestModulesNoShared]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellCommitParentsComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {}
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
