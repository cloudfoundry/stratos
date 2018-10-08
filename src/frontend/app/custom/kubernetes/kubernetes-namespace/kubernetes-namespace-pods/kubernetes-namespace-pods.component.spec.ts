import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesNamespacePodsComponent } from './kubernetes-namespace-pods.component';

describe('KubernetesNamespacePodsComponent', () => {
  let component: KubernetesNamespacePodsComponent;
  let fixture: ComponentFixture<KubernetesNamespacePodsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KubernetesNamespacePodsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNamespacePodsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
