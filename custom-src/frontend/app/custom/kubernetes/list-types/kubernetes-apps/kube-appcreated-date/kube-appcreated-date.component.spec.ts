import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import { KubeAppcreatedDateComponent } from './kube-appcreated-date.component';

describe('KubeAppcreatedDateComponent', () => {
  let component: KubeAppcreatedDateComponent;
  let fixture: ComponentFixture<KubeAppcreatedDateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [KubeAppcreatedDateComponent],
      imports: KubernetesBaseTestModules
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubeAppcreatedDateComponent);
    component = fixture.componentInstance;
    const testString = 'test';
    component.row = {
      kubeId: testString,
      name: testString,
      pods: [],
      createdAt: (new Date()),
      status: testString,
      version: testString,
      chartName: testString,
      appVersion: testString,
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
