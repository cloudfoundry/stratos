import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import { KubernetesServicePortsComponent } from '../../kubernetes-service-ports/kubernetes-service-ports.component';
import { KubeServiceCardComponent } from './kubernetes-service-card.component';



describe('KubeServiceCardComponent', () => {
  let component: KubeServiceCardComponent;
  let fixture: ComponentFixture<KubeServiceCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],imports: [...KubernetesBaseTestModules,
        KubeServiceCardComponent,
        KubernetesServicePortsComponent
      ],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubeServiceCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
