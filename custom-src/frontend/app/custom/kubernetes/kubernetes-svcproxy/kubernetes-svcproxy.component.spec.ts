import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesServiceProxyComponent } from './kubernetes-svcproxy.component';

describe('KubernetesServiceProxyComponent', () => {
  let component: KubernetesServiceProxyComponent;
  let fixture: ComponentFixture<KubernetesServiceProxyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KubernetesServiceProxyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesServiceProxyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
