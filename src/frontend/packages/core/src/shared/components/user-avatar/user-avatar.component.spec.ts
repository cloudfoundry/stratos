import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { UserAvatarComponent } from './user-avatar.component';

describe('UserAvatarComponent', () => {
  let component: UserAvatarComponent;
  let fixture: ComponentFixture<UserAvatarComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [
        UserAvatarComponent,
      ]
    });
    TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserAvatarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // The initials are a picture of the user, not a label: the user menu
  // button is named "User menu" and the full name is shown beside every
  // avatar. Read out, they made the button's name differ from its
  // visible text (WCAG 2.5.3).
  it('hides the initials from assistive technology', async () => {
    fixture.componentRef.setInput('user', { name: { givenName: 'Ada', familyName: 'Lovelace' } } as any);
    await fixture.whenStable();
    const initials = [...fixture.nativeElement.querySelectorAll('div')].find((d: HTMLElement) => d.textContent?.trim() === 'AL' && !d.querySelector('div'));
    expect(initials).toBeTruthy();
    expect(initials.getAttribute('aria-hidden')).toBe('true');
  });
});
