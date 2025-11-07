import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import { KubeConfigHelper } from '../../kube-config.helper';
import { KubeConfigTableCertComponent } from './kube-config-table-cert.component';

describe('KubeConfigTableCertComponent', () => {
  let component: KubeConfigTableCertComponent;
  let fixture: ComponentFixture<KubeConfigTableCertComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...KubernetesBaseTestModules,

        KubeConfigTableCertComponent,
      ]providers: [
        
        KubeConfigHelper,

        provideZonelessChangeDetection(),
      ]
    }),
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubeConfigTableCertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
