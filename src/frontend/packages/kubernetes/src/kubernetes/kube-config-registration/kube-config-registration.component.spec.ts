import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { KubernetesBaseTestModules } from '../kubernetes.testing.module';
import { KubeConfigImportComponent } from './kube-config-import/kube-config-import.component';
import { KubeConfigRegistrationComponent } from './kube-config-registration.component';
import { KubeConfigSelectionComponent } from './kube-config-selection/kube-config-selection.component';

describe('KubeConfigRegistrationComponent', () => {
  let component: KubeConfigRegistrationComponent;
  let fixture: ComponentFixture<KubeConfigRegistrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: { endpointId: 'test' },
              queryParams: {}
            }
          }
        }
      ],
      imports: [
        ...KubernetesBaseTestModules,

        KubeConfigRegistrationComponent,
        KubeConfigSelectionComponent,
        KubeConfigImportComponent,
      ]}).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubeConfigRegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
