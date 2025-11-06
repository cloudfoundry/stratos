import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { KubernetesBaseTestModules } from '../../kubernetes.testing.module';
import { KubeConfigImportComponent } from './kube-config-import.component';

describe('KubeConfigImportComponent', () => {
  let component: KubeConfigImportComponent;
  let fixture: ComponentFixture<KubeConfigImportComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...KubernetesBaseTestModules
      ,
        KubeConfigImportComponent
      ]})
      .compileComponents();
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
