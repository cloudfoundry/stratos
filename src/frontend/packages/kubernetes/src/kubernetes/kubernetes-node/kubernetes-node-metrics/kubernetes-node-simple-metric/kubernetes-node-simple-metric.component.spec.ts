import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { KubernetesNodeSimpleMetricComponent } from './kubernetes-node-simple-metric.component';

describe('KubernetesNodeSimpleMetricComponent', () => {
  let component: KubernetesNodeSimpleMetricComponent;
  let fixture: ComponentFixture<KubernetesNodeSimpleMetricComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ KubernetesNodeSimpleMetricComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodeSimpleMetricComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
