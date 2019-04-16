import { HttpClient, HttpHandler } from '@angular/common/http';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabNavService } from '../../../../../tab-nav.service';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesBaseTestModules } from '../../kubernetes.testing.module';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';
import { KubernetesSummaryTabComponent } from './kubernetes-summary.component';

describe('KubernetesSummaryTabComponent', () => {
  let component: KubernetesSummaryTabComponent;
  let fixture: ComponentFixture<KubernetesSummaryTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [KubernetesSummaryTabComponent],
      imports: [...KubernetesBaseTestModules],
      providers: [
        KubernetesEndpointService,
        BaseKubeGuid,
        HttpClient,
        HttpHandler,
        TabNavService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesSummaryTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
