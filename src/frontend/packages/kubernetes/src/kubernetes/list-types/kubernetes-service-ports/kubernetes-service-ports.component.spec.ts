import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { KubernetesServicePortsComponent } from './kubernetes-service-ports.component';

describe('KubernetesServicePortsComponent', () => {
  let component: KubernetesServicePortsComponent;
  let fixture: ComponentFixture<KubernetesServicePortsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [KubernetesServicePortsComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesServicePortsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
