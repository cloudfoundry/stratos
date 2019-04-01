import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesNamespaceServicesComponent } from './kubernetes-namespace-services.component';

describe('KubernetesNamespaceServicesComponent', () => {
  let component: KubernetesNamespaceServicesComponent;
  let fixture: ComponentFixture<KubernetesNamespaceServicesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KubernetesNamespaceServicesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNamespaceServicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
