import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesBaseTestModules } from '../../kubernetes.testing.module';
import { KubernetesNodesTabComponent } from './kubernetes-nodes-tab.component';

describe('KubernetesNodesTabComponent', () => {
  let component: KubernetesNodesTabComponent;
  let fixture: ComponentFixture<KubernetesNodesTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [KubernetesNodesTabComponent],
      imports: KubernetesBaseTestModules,
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
