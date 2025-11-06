import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesBaseTestModules } from '../../kubernetes.testing.module';
import { KubernetesNodesTabComponent } from './kubernetes-nodes-tab.component';

describe('KubernetesNodesTabComponent', () => {
  let component: KubernetesNodesTabComponent;
  let fixture: ComponentFixture<KubernetesNodesTabComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        KubernetesNodesTabComponent,
        ...KubernetesBaseTestModules
      ],
      providers: [
        BaseKubeGuid,
        provideZonelessChangeDetection()
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodesTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
