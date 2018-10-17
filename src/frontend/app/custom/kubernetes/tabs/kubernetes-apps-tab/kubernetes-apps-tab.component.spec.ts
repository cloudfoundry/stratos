import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesAppsTabComponent } from './kubernetes-apps-tab.component';
import { BaseTestModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { BaseKubeGuid } from '../../kubernetes-page.types';

describe('KubernetesAppsTabComponent', () => {
  let component: KubernetesAppsTabComponent;
  let fixture: ComponentFixture<KubernetesAppsTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [KubernetesAppsTabComponent],
      imports: [BaseTestModules],
      providers: [BaseKubeGuid]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesAppsTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
