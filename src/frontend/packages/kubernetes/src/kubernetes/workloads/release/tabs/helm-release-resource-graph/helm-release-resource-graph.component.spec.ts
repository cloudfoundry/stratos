import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, input, output, provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { GraphComponent } from '@swimlane/ngx-graph';
import { SidePanelService } from '@stratosui/core';

import { HelmReleaseProviders, KubernetesBaseTestModules, KubeBaseGuidMock } from '../../../../kubernetes.testing.module';
import { KubernetesEndpointService } from '../../../../services/kubernetes-endpoint.service';
import { KubernetesAnalysisService } from '../../../../services/kubernetes.analysis.service';
import { AnalysisReportSelectorComponent } from '../../../../analysis-report-viewer/analysis-report-selector/analysis-report-selector.component';
import { AnalysisReportViewerComponent } from '../../../../analysis-report-viewer/analysis-report-viewer.component';
import { HelmReleaseSocketService } from '../../helm-release-tab-base/helm-release-socket-service';
import { HelmReleaseDataService } from '../../helm-release-data.service';
import { HelmReleaseGraph } from '../../../workload.types';
import { HelmReleaseResourceGraphComponent } from './helm-release-resource-graph.component';

// ngx-graph's real GraphComponent needs a browser layout engine; the tests
// here cover this component's own rendering, so a stub stands in for it.
@Component({ selector: 'ngx-graph', standalone: true, template: '' })
class StubGraphComponent {
  nodes = input<unknown[]>();
  links = input<unknown[]>();
  layout = input<unknown>();
  enableDrag = input<boolean>();
  update$ = input<unknown>();
  zoomToFit$ = input<unknown>();
  drawComplete = output<void>();
}

describe('HelmReleaseResourceGraphComponent', () => {
  let component: HelmReleaseResourceGraphComponent;
  let fixture: ComponentFixture<HelmReleaseResourceGraphComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        KubernetesBaseTestModules,
        GraphComponent,

        HelmReleaseResourceGraphComponent,
        AnalysisReportSelectorComponent,
        AnalysisReportViewerComponent,
      ],
      providers: [
        ...HelmReleaseProviders,
        SidePanelService,
        KubernetesAnalysisService,
        KubernetesEndpointService,
        HelmReleaseSocketService,
        KubeBaseGuidMock,

        provideZonelessChangeDetection(),
      ]
    }).overrideComponent(HelmReleaseResourceGraphComponent, {
      remove: { imports: [GraphComponent] },
      add: { imports: [StubGraphComponent] },
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleaseResourceGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Regression: the graph arrives over the release socket, which writes into
  // HelmReleaseDataService. Under zoneless OnPush the view only re-renders
  // for signal reads, so this goes red if nodes/links become plain fields.
  it('renders the graph once the socket-fed signal delivers nodes', async () => {
    const guid = (component as unknown as { helper: { guid: string } }).helper.guid;
    const graph = {
      endpointId: 'kube', releaseTitle: 'rel',
      nodes: {
        a: { id: 'a', label: 'web', data: { kind: 'Deployment', status: 'ok', metadata: { name: 'web', namespace: 'ns' } } },
        b: { id: 'b', label: 'web-1', data: { kind: 'Pod', status: 'ok', metadata: { name: 'web-1', namespace: 'ns' } } },
      },
      links: { ab: { id: 'ab', source: 'a', target: 'b' } },
    } as unknown as HelmReleaseGraph;

    expect(fixture.nativeElement.querySelector('ngx-graph')).toBeNull();
    TestBed.inject(HelmReleaseDataService).setGraph(guid, graph);
    await fixture.whenStable();

    expect(component.nodes().length).toBe(2);
    expect(fixture.nativeElement.querySelector('ngx-graph')).not.toBeNull();
  });
});
