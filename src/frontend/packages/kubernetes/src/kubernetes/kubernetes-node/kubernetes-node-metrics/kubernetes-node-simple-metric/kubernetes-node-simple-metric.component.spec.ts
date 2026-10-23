import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { KubernetesNodeSimpleMetricComponent } from './kubernetes-node-simple-metric.component';

describe('KubernetesNodeSimpleMetricComponent', () => {
  let component: KubernetesNodeSimpleMetricComponent;
  let fixture: ComponentFixture<KubernetesNodeSimpleMetricComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [ KubernetesNodeSimpleMetricComponent ]
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(KubernetesNodeSimpleMetricComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('key', 'Mean');
    fixture.componentRef.setInput('value', '5');
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the bound key and value', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent;
    expect(text).toContain('Mean');
    expect(text).toContain('5');
  });
});
