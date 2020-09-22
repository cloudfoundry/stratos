import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MockChartService } from '../../../helm/monocular/shared/services/chart.service.mock';
import { ChartsService } from '../../../helm/monocular/shared/services/charts.service';
import { ConfigService } from '../../../helm/monocular/shared/services/config.service';
import { HelmReleaseProviders, KubeBaseGuidMock } from '../../kubernetes.testing.module';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';
import { WorkloadsBaseTestingModule } from '../workloads.testing.module';
import { UpgradeReleaseComponent } from './upgrade-release.component';


describe('UpgradeReleaseComponent', () => {
  let component: UpgradeReleaseComponent;
  let fixture: ComponentFixture<UpgradeReleaseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UpgradeReleaseComponent ],
      imports: [
        ...WorkloadsBaseTestingModule
      ],
      providers: [
        KubernetesEndpointService,
        KubeBaseGuidMock,
        ...HelmReleaseProviders,
        { provide: ChartsService, useValue: new MockChartService() },
        { provide: ConfigService, useValue: { appName: 'appName' } },
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UpgradeReleaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
