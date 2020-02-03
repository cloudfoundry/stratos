import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { SidePanelService } from '../../../shared/services/side-panel.service';
import { KubeBaseGuidMock, KubernetesBaseTestModules } from '../kubernetes.testing.module';
import { KubernetesEndpointService } from '../services/kubernetes-endpoint.service';
import { KubernetesResourceViewerComponent } from './kubernetes-resource-viewer.component';

describe('KubernetesResourceViewerComponent', () => {
  let component: KubernetesResourceViewerComponent;
  let fixture: ComponentFixture<KubernetesResourceViewerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [KubernetesResourceViewerComponent],
      imports: KubernetesBaseTestModules,
      providers: [
        KubernetesEndpointService,
        KubeBaseGuidMock,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {
                endpointId: 'anything'
              },
              queryParams: {}
            }
          }
        },
        SidePanelService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesResourceViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
