import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { EndpointModel } from '../../../../../store/src/types/endpoint.types';
import { GIT_ENDPOINT_SUB_TYPES } from '../../../store/git-entity-factory';
import { GitEndpointDetailsComponent } from './git-endpoint-details.component';

describe('GitEndpointDetailsComponent', () => {
  let component: GitEndpointDetailsComponent;
  let fixture: ComponentFixture<GitEndpointDetailsComponent>;

  const show = async (userName: string) => {
    component.row = {
      guid: 'gh-1', name: 'GitHub', cnsi_type: 'git', sub_type: GIT_ENDPOINT_SUB_TYPES.GITHUB,
      user: { guid: 'u', name: userName, admin: false },
    } as EndpointModel;
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [
        GitEndpointDetailsComponent,
      ]
    })
      .compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(GitEndpointDetailsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows a GitHub user with their avatar', async () => {
    const el = await show('octocat');
    expect(el.textContent).toContain('octocat');
    expect(el.querySelector('img')?.getAttribute('src')).toBe('https://avatars.githubusercontent.com/octocat');
  });

  // jetstream stores "**token**" as the user name when it cannot read the
  // token's user; there is no such GitHub user to show an avatar for.
  it('shows Unknown and no avatar when the user name is not known', async () => {
    const el = await show('**token**');
    expect(el.textContent).toContain('Unknown');
    expect(el.querySelector('img')).toBeNull();
  });
});
