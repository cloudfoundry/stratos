import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseTestModulesNoShared } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { GithubCommitAuthorComponent } from '../../../../github-commit-author/github-commit-author.component';
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
      entity: {
        commit: {
          author: {
            name: 'author_name'
          }
        }
      }
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
