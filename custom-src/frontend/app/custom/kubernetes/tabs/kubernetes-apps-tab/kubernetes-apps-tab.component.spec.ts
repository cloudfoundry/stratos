import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesAppsTabComponent } from './kubernetes-apps-tab.component';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesBaseTestModules } from '../../kubernetes.testing.module';

describe('KubernetesAppsTabComponent', () => {
  let component: KubernetesAppsTabComponent;
  let fixture: ComponentFixture<KubernetesAppsTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [KubernetesAppsTabComponent],
      imports: [KubernetesBaseTestModules],
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
