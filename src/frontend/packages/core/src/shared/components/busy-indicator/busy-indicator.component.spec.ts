import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { AppBusyComponent, pickBusyVariant } from './busy-indicator.component';

describe('AppBusyComponent', () => {
  let fixture: ComponentFixture<AppBusyComponent>;
  let component: AppBusyComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppBusyComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    fixture = TestBed.createComponent(AppBusyComponent);
    component = fixture.componentInstance;
  });

  function root(): HTMLElement {
    return (fixture.nativeElement as HTMLElement).querySelector('[data-test="busy"]')!;
  }

  it('defaults to the arc variant sized 1em with a status role', () => {
    fixture.detectChanges();
    expect(root().getAttribute('role')).toBe('status');
    expect(root().style.width).toBe('1em');
    expect(root().querySelector('.animate-spin')).toBeTruthy();
  });

  it('renders three blinking dots for the dots variant', () => {
    component.variant = 'dots';
    fixture.detectChanges();
    expect(root().querySelectorAll('.busy-blink-dot').length).toBe(3);
    expect(root().querySelector('.animate-spin')).toBeNull();
  });

  it('renders the theme logo image for the logo variant', () => {
    component.variant = 'logo';
    fixture.detectChanges();
    const img = root().querySelector('img')!;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toContain('logo');
  });

  it('pinned variant beats context; context picks deterministically', () => {
    component.variant = 'dash';
    component.context = 'anything';
    fixture.detectChanges();
    expect(root().querySelector('.border-dashed')).toBeTruthy();

    // Same context string → same variant, every time.
    expect(pickBusyVariant('space-users')).toBe(pickBusyVariant('space-users'));
    // Logo is never auto-picked.
    for (const ctx of ['a', 'b', 'c', 'd', 'e', 'f', 'g']) {
      expect(pickBusyVariant(ctx)).not.toBe('logo');
    }
  });

  it('honors an explicit size', () => {
    component.size = '2rem';
    fixture.detectChanges();
    expect(root().style.width).toBe('2rem');
    expect(root().style.height).toBe('2rem');
  });
});
