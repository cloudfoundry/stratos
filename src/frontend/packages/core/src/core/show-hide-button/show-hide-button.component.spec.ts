import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ShowHideButtonComponent } from './show-hide-button.component';

describe('ShowHideButtonComponent', () => {
  let component: ShowHideButtonComponent;
  let fixture: ComponentFixture<ShowHideButtonComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [
        ShowHideButtonComponent,
      ],
    });
    TestBed.compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(ShowHideButtonComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('flips on each click and tells the host the new state', async () => {
    const changed = vi.fn<(show: boolean) => void>();
    component.changed.subscribe(changed);
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.textContent?.trim()).toBe('visibility_off');
    expect(changed).not.toHaveBeenCalled();

    button.click();
    await fixture.whenStable();
    expect(changed).toHaveBeenLastCalledWith(true);
    expect(button.textContent?.trim()).toBe('visibility');
    expect(button.getAttribute('aria-pressed')).toBe('false');

    button.click();
    await fixture.whenStable();
    expect(changed).toHaveBeenLastCalledWith(false);
    expect(button.textContent?.trim()).toBe('visibility_off');
    expect(changed).toHaveBeenCalledTimes(2);
  });
});
