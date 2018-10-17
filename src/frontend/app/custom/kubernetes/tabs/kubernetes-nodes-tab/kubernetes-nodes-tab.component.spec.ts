import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesNodesTabComponent } from './kubernetes-nodes-tab.component';
import { BaseTestModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { BaseKubeGuid } from '../../kubernetes-page.types';

xdescribe('KubernetesNodesTabComponent', () => {
  let component: KubernetesNodesTabComponent;
  let fixture: ComponentFixture<KubernetesNodesTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [KubernetesNodesTabComponent],
      imports: BaseTestModules,
      providers: [BaseKubeGuid]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodesTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
