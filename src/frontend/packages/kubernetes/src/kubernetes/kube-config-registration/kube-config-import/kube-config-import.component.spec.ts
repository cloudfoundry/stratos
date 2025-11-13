import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { KubernetesBaseTestModules } from '../../kubernetes.testing.module';
import { KubeConfigImportComponent } from './kube-config-import.component';

describe('KubeConfigImportComponent', () => {
  let component: KubeConfigImportComponent;
  let fixture: ComponentFixture<KubeConfigImportComponent>;

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

        KubeConfigImportComponent,
      ]}).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubeConfigImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
