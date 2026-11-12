import { HttpClient } from '@angular/common/http';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect } from 'vitest';

import { SessionService } from '../../../../core/src/core/session.service';
import { TailwindSnackBarService } from '../../../../core/src/shared/services/tailwind-snackbar.service';
import { KubernetesAnalysisService } from './kubernetes.analysis.service';
import { KubernetesEndpointService } from './kubernetes-endpoint.service';

describe('KubernetesAnalysisService', () => {
  const create = (session: Record<string, unknown>) => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: SessionService, useValue: { sessionData: signal(session) } },
        { provide: KubernetesEndpointService, useValue: { kubeGuid: 'kube-1' } },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {} } } },
        { provide: HttpClient, useValue: {} },
        { provide: TailwindSnackBarService, useValue: {} },
      ],
    });
    return TestBed.inject(KubernetesAnalysisService);
  };

  it('lists the configured engines it knows, namespace ones only while analysis is on', () => {
    const service = create({
      plugins: { analysis: true },
      'plugin-config': { analysisEngines: 'popeye, unknown,kube-score' },
    });
    expect(service.enabled()).toBe(true);
    expect(service.hideAnalysis()).toBe(false);
    expect(service.analyzers().map(a => a.id)).toEqual(['popeye', 'kube-score']);
    expect(service.namespaceAnalyzers()?.map(a => a.id)).toEqual(['popeye', 'kube-score']);
  });

  it('hides analysis and has no namespace analyzers when the plugin is off', () => {
    const service = create({ 'plugin-config': { analysisEngines: 'popeye' } });
    expect(service.enabled()).toBe(false);
    expect(service.hideAnalysis()).toBe(true);
    expect(service.namespaceAnalyzers()).toBeNull();
  });
});
