import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MDAppModule } from './../../../../../core/md.module';

import { ResourceAlertViewComponent } from './resource-alert-view.component';
import { KubernetesBaseTestModules, KubeBaseGuidMock } from '../../../kubernetes.testing.module';
import { KubernetesAnalysisService } from '../../../services/kubernetes.analysis.service';
import { KubernetesEndpointService } from '../../../services/kubernetes-endpoint.service';

describe('ResourceAlertViewComponent', () => {
  let component: ResourceAlertViewComponent;
  let fixture: ComponentFixture<ResourceAlertViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ResourceAlertViewComponent ],
      imports: [
        KubernetesBaseTestModules,
        MDAppModule
      ],
      providers: [
        KubernetesAnalysisService,
        KubernetesEndpointService,
        KubeBaseGuidMock,
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResourceAlertViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
