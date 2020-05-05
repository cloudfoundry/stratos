import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  GithubCommitAuthorComponent,
} from '../../../../../../../../core/src/shared/components/github-commit-author/github-commit-author.component';
import { BaseTestModulesNoShared } from '../../../../../../../../core/test-framework/core-test.helper';
import { TableCellCommitAuthorComponent } from './table-cell-commit-author.component';

describe('TableCellCommitAuthorComponent', () => {
  let component: TableCellCommitAuthorComponent<any>;
  let fixture: ComponentFixture<TableCellCommitAuthorComponent<any>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellCommitAuthorComponent, GithubCommitAuthorComponent],
      imports: [...BaseTestModulesNoShared]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellCommitAuthorComponent);
    component = fixture.componentInstance;
    component.row = {
      commit: {
        author: {
          name: 'author_name'
        }
      }
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
