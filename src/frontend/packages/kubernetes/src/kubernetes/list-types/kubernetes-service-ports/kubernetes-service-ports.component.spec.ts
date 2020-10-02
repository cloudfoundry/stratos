import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesServicePortsComponent } from './kubernetes-service-ports.component';

describe('KubernetesServicePortsComponent', () => {
  let component: KubernetesServicePortsComponent;
  let fixture: ComponentFixture<KubernetesServicePortsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [KubernetesServicePortsComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesServicePortsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
