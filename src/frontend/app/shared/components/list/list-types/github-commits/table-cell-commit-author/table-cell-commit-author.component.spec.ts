import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseTestModulesNoShared } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { TableCellCommitAuthorComponent } from './table-cell-commit-author.component';

describe('TableCellCommitAuthorComponent', () => {
  let component: TableCellCommitAuthorComponent<any>;
  let fixture: ComponentFixture<TableCellCommitAuthorComponent<any>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellCommitAuthorComponent],
      imports: [...BaseTestModulesNoShared]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellCommitAuthorComponent);
    component = fixture.componentInstance;
    component.row = {
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
