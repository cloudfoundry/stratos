import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import { entityCatalog } from '@stratosui/store';
import { KubeConfigHelper } from '../../kube-config.helper';
import { KubeConfigFileCluster } from '../../kube-config.types';
import { KubeConfigTableUserSelectComponent } from './kube-config-table-user-select.component';

describe('KubeConfigTableUserSelectComponent', () => {
  let component: KubeConfigTableUserSelectComponent;
  let fixture: ComponentFixture<KubeConfigTableUserSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ...KubernetesBaseTestModules,

        KubeConfigTableUserSelectComponent,
      ],
      providers: [
        KubeConfigHelper,
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();

    // Ensure entity catalog is initialized before creating the component
    // This triggers the catalog to load all the kubernetes entities including endpoint definitions
    entityCatalog.getAllEndpointTypes();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubeConfigTableUserSelectComponent);
    component = fixture.componentInstance;
    // ngOnInit only reads _user and _users; an intentionally partial cluster
    // is enough to drive this creation test.
    component.row = {
      _users: []
    } as Partial<KubeConfigFileCluster> as KubeConfigFileCluster;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('names its drop-down "User"', async () => {
    const withUsers = TestBed.createComponent(KubeConfigTableUserSelectComponent);
    withUsers.componentInstance.row = {
      _users: [{ name: 'u1' }],
    } as Partial<KubeConfigFileCluster> as KubeConfigFileCluster;
    await withUsers.whenStable();
    const trigger = (withUsers.nativeElement as HTMLElement).querySelector('[role="combobox"]');
    expect(trigger).toBeTruthy();
    expect(trigger!.getAttribute('aria-label')).toBe('User');
  });
});
