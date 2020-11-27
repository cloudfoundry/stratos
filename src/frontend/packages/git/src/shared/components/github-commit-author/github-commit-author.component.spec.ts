import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GithubCommitAuthorComponent } from './github-commit-author.component';

describe('GithubCommitAuthorComponent', () => {
  let component: GithubCommitAuthorComponent;
  let fixture: ComponentFixture<GithubCommitAuthorComponent>;
  let element: HTMLElement;

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
          name: 'Author Name',
          email: '',
          date: ''
        },
        message: ''
      },
      author: {
        login: 'author_name',
        id: 12798864,
        avatar_url: 'https://host/path',
        html_url: 'https://host/author_name',
      }
    };
    fixture.detectChanges();
    element = fixture.nativeElement;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render avatar img', () => {
    const img = element.querySelector('img');
    expect(img.src).toBe(component.commit.author.avatar_url);
  });

  it('should render author name', () => {
    expect(element.textContent).toContain(component.commit.commit.author.name);
  });

  it('should render github link', () => {
    const anchor = element.querySelector('a');
    expect(anchor.href).toBe(component.commit.author.html_url);
  });

  it('should not render github link / avatar', () => {
    component.commit.author = null;
    fixture.detectChanges();

    const anchor = element.querySelector('a');
    const img = element.querySelector('img');
    expect(anchor).toBeNull();
    expect(img).toBeNull();
  });
});
