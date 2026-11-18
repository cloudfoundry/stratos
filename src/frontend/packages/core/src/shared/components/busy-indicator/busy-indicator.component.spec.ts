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

  it('defaults to the arc variant sized 1em with a status role', async () => {
    await fixture.whenStable();
    expect(root().getAttribute('role')).toBe('status');
    expect(root().style.width).toBe('1em');
    expect(root().querySelector('.animate-spin')).toBeTruthy();
  });

  it('renders three blinking dots for the dots variant', async () => {
    fixture.componentRef.setInput('variant', 'dots');
    await fixture.whenStable();
    expect(root().querySelectorAll('.busy-blink-dot').length).toBe(3);
    expect(root().querySelector('.animate-spin')).toBeNull();
  });

  it('renders the theme logo image for the logo variant', async () => {
    fixture.componentRef.setInput('variant', 'logo');
    await fixture.whenStable();
    const img = root().querySelector('img')!;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toContain('logo');
  });

  it('pinned variant beats context; context picks deterministically', async () => {
    fixture.componentRef.setInput('variant', 'dash');
    fixture.componentRef.setInput('context', 'anything');
    await fixture.whenStable();
    expect(root().querySelector('.border-dashed')).toBeTruthy();

    // Same context string → same variant, every time.
    expect(pickBusyVariant('space-users')).toBe(pickBusyVariant('space-users'));
    // Logo is never auto-picked.
    for (const ctx of ['a', 'b', 'c', 'd', 'e', 'f', 'g']) {
      expect(pickBusyVariant(ctx)).not.toBe('logo');
    }
  });

  it('honors an explicit size', async () => {
    fixture.componentRef.setInput('size', '2rem');
    await fixture.whenStable();
    expect(root().style.width).toBe('2rem');
    expect(root().style.height).toBe('2rem');
  });
});
