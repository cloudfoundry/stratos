import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GithubCommitAuthorComponent } from './github-commit-author.component';

describe('GithubCommitAuthorComponent', () => {
  let component: GithubCommitAuthorComponent;
  let fixture: ComponentFixture<GithubCommitAuthorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [GithubCommitAuthorComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GithubCommitAuthorComponent);
    component = fixture.componentInstance;
    component.commit = {
      sha: '',
      commit: {
        author: {
          name: 'author_name',
          email: '',
          date: ''
        },
        message: ''
      }
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
