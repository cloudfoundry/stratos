import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import type {
  IListDataSource,
} from '../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source-types';
import { KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import type { KubeConfigFileCluster } from '../../kube-config.types';
import { KubeConfigTableNameComponent } from './kube-config-table-name.component';

describe('KubeConfigTableName', () => {
  let component: KubeConfigTableNameComponent;
  let fixture: ComponentFixture<KubeConfigTableNameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [
        ...KubernetesBaseTestModules,

        KubeConfigTableNameComponent,
      ]}).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubeConfigTableNameComponent);
    component = fixture.componentInstance;
    component.dataSource = {
      getRowUniqueId: (row) => ''
    } as IListDataSource<KubeConfigFileCluster>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
