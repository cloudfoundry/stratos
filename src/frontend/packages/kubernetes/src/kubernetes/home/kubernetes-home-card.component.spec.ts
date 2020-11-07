import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EndpointModel } from '../../../../store/src/types/endpoint.types';
import { BaseKubeGuid } from '../kubernetes-page.types';
import { KubernetesBaseTestModules } from '../kubernetes.testing.module';
import { KubernetesEndpointService } from '../services/kubernetes-endpoint.service';
import { KubernetesHomeCardComponent } from './kubernetes-home-card.component';

describe('KubernetesHomeCardComponent', () => {
  let component: KubernetesHomeCardComponent;
  let fixture: ComponentFixture<KubernetesHomeCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KubernetesHomeCardComponent ],
      imports: [...KubernetesBaseTestModules],
      providers: [ KubernetesEndpointService, BaseKubeGuid ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesHomeCardComponent);
    component = fixture.componentInstance;
    component.endpoint = {} as EndpointModel;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
