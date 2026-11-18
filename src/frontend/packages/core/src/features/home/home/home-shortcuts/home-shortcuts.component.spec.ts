import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { HomeShortcutsComponent } from './home-shortcuts.component';

describe('HomeShortcutsComponent', () => {
  let component: HomeShortcutsComponent;
  let fixture: ComponentFixture<HomeShortcutsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
      imports: [
        HomeShortcutsComponent,
      ],
      
    });
    TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeShortcutsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // The icon repeats the link beside it: clickable, but no Tab stop of its
  // own, and nothing focusable hidden from screen readers.
  it('gives each shortcut one Tab stop, its text link', async () => {
    fixture.componentRef.setInput('shortcuts', [{ title: 'View Applications', link: '/applications', icon: 'apps' }]);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const focusable = [...el.querySelectorAll<HTMLElement>('a[href], [tabindex]')].filter(e => e.tabIndex >= 0);
    expect(focusable.map(e => e.textContent!.trim())).toEqual(['View Applications']);
    el.querySelectorAll('[aria-hidden="true"]').forEach(h =>
      expect([h, ...h.querySelectorAll<HTMLElement>('*')].filter(e => (e as HTMLElement).tabIndex >= 0)).toEqual([]));
  });
});
