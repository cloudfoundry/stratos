import { ComponentFixture, TestBed } from '@angular/core/testing';
import {  ChangeDetectorRef, provideZonelessChangeDetection } from '@angular/core';
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
      },
      guid: '',
      scmType: 'github',
      projectName: 'test',
      endpointGuid: '',
    };
    fixture.detectChanges();
    element = fixture.nativeElement;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render avatar img', () => {
    const img = element.querySelector('img');
    // strict: fixture sets a complete author/avatar, so the img and author are present.
    expect(img!.src).toBe(component.commit.author!.avatar_url);
  });

  it('should render author name', () => {
    // strict: fixture always sets commit.commit with an author name.
    expect(element.textContent).toContain(component.commit.commit!.author.name);
  });

  it('should render github link', () => {
    const anchor = element.querySelector('a');
    // strict: fixture sets a complete author, so the anchor and author are present.
    expect(anchor!.href).toBe(component.commit.author!.html_url);
  });

  it('should not render github link / avatar', () => {
    // OnPush change detection requires new object reference and manual check
    component.commit = {
      ...component.commit,
      author: undefined,
    };
    // Manually trigger change detection for OnPush strategy
    const cdr = fixture.debugElement.injector.get(ChangeDetectorRef);
    cdr.markForCheck();
    fixture.detectChanges();

    // Re-query the element after change detection
    const updatedElement = fixture.nativeElement;
    const anchor = updatedElement.querySelector('a');
    const img = updatedElement.querySelector('img');
    expect(anchor).toBeNull();
    expect(img).toBeNull();
  });
});
