import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { KubernetesNodeMetricsChartComponent } from './kubernetes-node-metrics-chart.component';
import { KubernetesBaseTestModules } from '../../../kubernetes.testing.module';

describe('KubernetesNodeMetricsChartComponent', () => {
  let component: KubernetesNodeMetricsChartComponent;
  let fixture: ComponentFixture<KubernetesNodeMetricsChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [
        KubernetesNodeMetricsChartComponent,
        ...KubernetesBaseTestModules,
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodeMetricsChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
