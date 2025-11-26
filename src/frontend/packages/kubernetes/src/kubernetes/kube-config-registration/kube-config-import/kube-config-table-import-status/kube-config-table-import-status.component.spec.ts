import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import { KubeConfigTableImportStatusComponent } from './kube-config-table-import-status.component';

describe('KubeConfigTableImportStatusComponent', () => {
  let component: KubeConfigTableImportStatusComponent;
  let fixture: ComponentFixture<KubeConfigTableImportStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [
        ...KubernetesBaseTestModules,

        KubeConfigTableImportStatusComponent,
      ]}).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubeConfigTableImportStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
