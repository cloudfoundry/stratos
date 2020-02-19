import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxGraphModule } from '@swimlane/ngx-graph';
import { SidePanelService } from 'frontend/packages/core/src/shared/services/side-panel.service';
import { TabNavService } from 'frontend/packages/core/tab-nav.service';

import { HelmReleaseProviders, KubernetesBaseTestModules } from '../../../../kubernetes.testing.module';
import { HelmReleaseResourceGraphComponent } from './helm-release-resource-graph.component';

describe('HelmReleaseResourceGraphComponent', () => {
  let component: HelmReleaseResourceGraphComponent;
  let fixture: ComponentFixture<HelmReleaseResourceGraphComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...KubernetesBaseTestModules,
        NgxGraphModule
      ],
      declarations: [HelmReleaseResourceGraphComponent],
      providers: [
        ...HelmReleaseProviders,
        SidePanelService,
        TabNavService,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleaseResourceGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
