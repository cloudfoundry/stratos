import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesBaseTestModules } from '../../kubernetes.testing.module';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';
import { KubernetesPodsTabComponent } from './kubernetes-pods-tab.component';

describe('KubernetesPodsTabComponent', () => {
  let component: KubernetesPodsTabComponent;
  let fixture: ComponentFixture<KubernetesPodsTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [KubernetesPodsTabComponent],
      imports: KubernetesBaseTestModules,
      providers: [BaseKubeGuid, KubernetesEndpointService]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesPodsTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
