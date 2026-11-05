import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { MDAppModule } from '../../../../../../core/src/public-api';
import { KubeBaseGuidMock, KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';
import { KubernetesAnalysisService } from '../../../services/kubernetes.analysis.service';
import { ResourceAlertViewComponent } from './resource-alert-view.component';

describe('ResourceAlertViewComponent', () => {
  let component: ResourceAlertViewComponent;
  let fixture: ComponentFixture<ResourceAlertViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        KubernetesBaseTestModules,
        MDAppModule,
        ResourceAlertViewComponent,
      ],
      providers: [
        KubernetesAnalysisService,
        KubernetesEndpointService,
        KubeBaseGuidMock,
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(ResourceAlertViewComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('groups the alerts by resource, from a list or from an object holding one', async () => {
    const alerts = [
      { namespace: 'ns', name: 'pod-a', level: 2, message: 'first' },
      { namespace: 'ns', name: 'pod-a', level: 3, message: 'second' },
      { name: 'node-b', level: 1, message: 'third' },
    ];
    const headers = () => Array.from(fixture.nativeElement.querySelectorAll('.font-bold')).map((el: any) => el.textContent);

    fixture.componentRef.setInput('alerts', alerts);
    await fixture.whenStable();
    expect(headers()).toEqual(['ns/pod-a', 'node-b']);
    expect(fixture.nativeElement.textContent).toContain('second');

    fixture.componentRef.setInput('alerts', { alerts: [alerts[2]] });
    await fixture.whenStable();
    expect(headers()).toEqual(['node-b']);

    // Empty alerts keep what is shown.
    fixture.componentRef.setInput('alerts', null);
    await fixture.whenStable();
    expect(headers()).toEqual(['node-b']);
  });
});
