import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabNavService } from '../../../../../tab-nav.service';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesBaseTestModules } from '../../kubernetes.testing.module';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';
import { KubernetesNamespaceService } from '../../services/kubernetes-namespace.service';
import { KubernetesNamespaceServicesComponent } from './kubernetes-namespace-services.component';

describe('KubernetesNamespaceServicesComponent', () => {
  let component: KubernetesNamespaceServicesComponent;
  let fixture: ComponentFixture<KubernetesNamespaceServicesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [KubernetesNamespaceServicesComponent],
      imports: [...KubernetesBaseTestModules],
      providers: [
        TabNavService,
        BaseKubeGuid,
        KubernetesNamespaceService,
        KubernetesEndpointService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNamespaceServicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
