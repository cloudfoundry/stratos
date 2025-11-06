import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { KubernetesBaseTestModules } from '../../kubernetes.testing.module';
import { KubernetesNamespacePreviewComponent } from './kubernetes-namespace-preview.component';

describe('KubernetesNamespacePreviewComponent', () => {
  let component: KubernetesNamespacePreviewComponent;
  let fixture: ComponentFixture<KubernetesNamespacePreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({imports: [...KubernetesBaseTestModules,
        KubernetesNamespacePreviewComponent
      ],

    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNamespacePreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
