import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { entityCatalog } from '@stratosui/store';
import { KubernetesBaseTestModules } from '../../kubernetes.testing.module';
import { kubeEntityCatalog } from '../../kubernetes-entity-generator';
import { KubeConfigHelper } from '../kube-config.helper';
import { KubeConfigSelectionComponent } from './kube-config-selection.component';

describe('KubeConfigSelectionComponent', () => {
  let component: KubeConfigSelectionComponent;
  let fixture: ComponentFixture<KubeConfigSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        // Provided by the registration wizard in the app (the helper must
        // outlive the lazily-instantiated selection step) — the spec hosts
        // the component directly, so provide it here.
        KubeConfigHelper,
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

        KubeConfigSelectionComponent,
      ]}).compileComponents();

    // Ensure the Kubernetes endpoint entity is registered in the catalog
    // This is required because KubeConfigHelper -> KubeConfigAuthHelper depends on it
    // The KubeConfigAuthHelper accesses defn.subTypes which is only available when the endpoint is registered
    entityCatalog.register(kubeEntityCatalog.endpoint);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubeConfigSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // The cell's edit box replaces the name text; it takes the column's name.
  it('names the inline cluster name box', async () => {
    const helper = TestBed.inject(KubeConfigHelper);
    await firstValueFrom(helper.parse(`
apiVersion: v1
kind: Config
clusters:
- name: c1
  cluster:
    server: https://1.2.3.4:6443
contexts:
- name: c1
  context:
    cluster: c1
    user: u1
users:
- name: u1
  user:
    token: t
`));
    await fixture.whenStable();
    const [cluster] = await firstValueFrom(helper.clusters$);
    component.startEdit(cluster);
    await fixture.whenStable();
    const box = (fixture.nativeElement as HTMLElement).querySelector('[data-test="row"] input:not([type])');
    expect(box).toBeTruthy();
    expect(box!.getAttribute('aria-label')).toBe('Name');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
