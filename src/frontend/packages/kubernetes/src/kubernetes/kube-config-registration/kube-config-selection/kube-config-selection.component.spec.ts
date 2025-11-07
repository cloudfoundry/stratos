import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { KubernetesBaseTestModules } from '../../kubernetes.testing.module';
import { KubeConfigSelectionComponent } from './kube-config-selection.component';

describe('KubeConfigSelectionComponent', () => {
  let component: KubeConfigSelectionComponent;
  let fixture: ComponentFixture<KubeConfigSelectionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [
        ...KubernetesBaseTestModules,

        KubeConfigSelectionComponent,
      ]}),
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubeConfigSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
