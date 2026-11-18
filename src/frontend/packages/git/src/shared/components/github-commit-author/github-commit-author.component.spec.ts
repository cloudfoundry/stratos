import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { GithubCommitAuthorComponent } from './github-commit-author.component';

describe('GithubCommitAuthorComponent', () => {
  let component: GithubCommitAuthorComponent;
  let fixture: ComponentFixture<GithubCommitAuthorComponent>;
  let element: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [GithubCommitAuthorComponent]
    })
      .compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(GithubCommitAuthorComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('commit', {
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
      },
      guid: '',
      scmType: 'github',
      projectName: 'test',
      endpointGuid: '',
    });
    await fixture.whenStable();
    element = fixture.nativeElement;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render avatar img', () => {
    const img = element.querySelector('img');
    // strict: fixture sets a complete author/avatar, so the img and author are present.
    expect(img!.src).toBe(component.commit().author!.avatar_url);
  });

  // An avatar host the page's Content-Security-Policy refuses (a GitHub
  // Enterprise host not in CONSOLE_CSP_GIT_HOSTS) must not leave a broken
  // image and its alt text in the row.
  it('hides the avatar when it fails to load', () => {
    const img = element.querySelector('img')!;
    img.dispatchEvent(new Event('error'));
    expect(img.hidden).toBe(true);
  });

  it('should render author name', () => {
    // strict: fixture always sets commit.commit with an author name.
    expect(element.textContent).toContain(component.commit().commit!.author.name);
  });

  it('should render github link', () => {
    const anchor = element.querySelector('a');
    // strict: fixture sets a complete author, so the anchor and author are present.
    expect(anchor!.href).toBe(component.commit().author!.html_url);
  });

  it('should not render github link / avatar', async () => {
    fixture.componentRef.setInput('commit', {
      ...component.commit(),
      author: undefined,
    });
    await fixture.whenStable();

    // Re-query the element after change detection
    const updatedElement = fixture.nativeElement;
    const anchor = updatedElement.querySelector('a');
    const img = updatedElement.querySelector('img');
    expect(anchor).toBeNull();
    expect(img).toBeNull();
  });
});
