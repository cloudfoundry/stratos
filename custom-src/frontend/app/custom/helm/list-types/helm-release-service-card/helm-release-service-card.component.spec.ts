import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseTestModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { KubernetesServicePortsComponent } from '../../../kubernetes/list-types/kubernetes-service-ports/kubernetes-service-ports.component';
import { HelmReleaseServiceCardComponent } from './helm-release-service-card.component';


describe('HelmReleaseServiceCardComponent', () => {
  let component: HelmReleaseServiceCardComponent;
  let fixture: ComponentFixture<HelmReleaseServiceCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        HelmReleaseServiceCardComponent,
        KubernetesServicePortsComponent
      ],
      imports: [...BaseTestModules],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleaseServiceCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
