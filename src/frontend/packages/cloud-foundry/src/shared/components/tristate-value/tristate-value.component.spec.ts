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

  it('renders the value when known', async () => {
    fixture.componentRef.setInput('value', 'broker-admin');
    await fixture.whenStable();
    const known = host.querySelector('.tristate-value--known');
    expect(known?.textContent).toBe('broker-admin');
    expect(host.querySelector('.tristate-value--unavailable')).toBeNull();
  });

  it('renders "Not Available" with tooltip when unavailable', async () => {
    fixture.componentRef.setInput('value', undefined);
    fixture.componentRef.setInput('unavailable', true);
    await fixture.whenStable();
    const unavailable = host.querySelector('.tristate-value--unavailable');
    expect(unavailable?.textContent).toBe('Not Available');
    const directive = fixture.debugElement.query(By.directive(CustomTooltipDirective))
      ?.injector.get(CustomTooltipDirective);
    expect(directive?.tooltipText()).toBe('Not exposed by V3 API');
  });

  it('renders empty text when value is missing but available', async () => {
    fixture.componentRef.setInput('value', null);
    fixture.componentRef.setInput('unavailable', false);
    fixture.componentRef.setInput('emptyText', '—');
    await fixture.whenStable();
    const empty = host.querySelector('.tristate-value--empty');
    expect(empty?.textContent).toBe('—');
  });

  it('treats empty string as known-empty, not known', async () => {
    fixture.componentRef.setInput('value', '');
    await fixture.whenStable();
    expect(host.querySelector('.tristate-value--empty')).not.toBeNull();
    expect(host.querySelector('.tristate-value--known')).toBeNull();
  });

  it('prefers unavailable over a stray value', async () => {
    fixture.componentRef.setInput('value', 'should-not-render');
    fixture.componentRef.setInput('unavailable', true);
    await fixture.whenStable();
    expect(host.querySelector('.tristate-value--unavailable')).not.toBeNull();
    expect(host.querySelector('.tristate-value--known')).toBeNull();
  });

  it('honours a custom unavailable tooltip', async () => {
    fixture.componentRef.setInput('unavailable', true);
    fixture.componentRef.setInput('unavailableTooltip', 'Field write-only in V3');
    await fixture.whenStable();
    const directive = fixture.debugElement.query(By.directive(CustomTooltipDirective))
      ?.injector.get(CustomTooltipDirective);
    expect(directive?.tooltipText()).toBe('Field write-only in V3');
  });
});
