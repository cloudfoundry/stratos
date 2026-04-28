import { TestBed, ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach } from 'vitest';

import { CustomTooltipDirective } from '@stratosui/core';
import { TristateValueComponent } from './tristate-value.component';

describe('TristateValueComponent', () => {
  let fixture: ComponentFixture<TristateValueComponent>;
  let component: TristateValueComponent;
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TristateValueComponent] });
    fixture = TestBed.createComponent(TristateValueComponent);
    component = fixture.componentInstance;
    host = fixture.nativeElement as HTMLElement;
  });

  it('renders the value when known', () => {
    component.value = 'broker-admin';
    fixture.detectChanges();
    const known = host.querySelector('.tristate-value--known');
    expect(known?.textContent).toBe('broker-admin');
    expect(host.querySelector('.tristate-value--unavailable')).toBeNull();
  });

  it('renders "Not Available" with tooltip when unavailable', () => {
    component.value = undefined;
    component.unavailable = true;
    fixture.detectChanges();
    const unavailable = host.querySelector('.tristate-value--unavailable');
    expect(unavailable?.textContent).toBe('Not Available');
    const directive = fixture.debugElement.query(By.directive(CustomTooltipDirective))
      ?.injector.get(CustomTooltipDirective);
    expect(directive?.tooltipText).toBe('Not exposed by V3 API');
  });

  it('renders empty text when value is missing but available', () => {
    component.value = null;
    component.unavailable = false;
    component.emptyText = '—';
    fixture.detectChanges();
    const empty = host.querySelector('.tristate-value--empty');
    expect(empty?.textContent).toBe('—');
  });

  it('treats empty string as known-empty, not known', () => {
    component.value = '';
    fixture.detectChanges();
    expect(host.querySelector('.tristate-value--empty')).not.toBeNull();
    expect(host.querySelector('.tristate-value--known')).toBeNull();
  });

  it('prefers unavailable over a stray value', () => {
    component.value = 'should-not-render';
    component.unavailable = true;
    fixture.detectChanges();
    expect(host.querySelector('.tristate-value--unavailable')).not.toBeNull();
    expect(host.querySelector('.tristate-value--known')).toBeNull();
  });

  it('honours a custom unavailable tooltip', () => {
    component.unavailable = true;
    component.unavailableTooltip = 'Field write-only in V3';
    fixture.detectChanges();
    const directive = fixture.debugElement.query(By.directive(CustomTooltipDirective))
      ?.injector.get(CustomTooltipDirective);
    expect(directive?.tooltipText).toBe('Field write-only in V3');
  });
});
