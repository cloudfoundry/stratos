import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { KubernetesServicePortsComponent } from './kubernetes-service-ports.component';

describe('KubernetesServicePortsComponent', () => {
  let component: KubernetesServicePortsComponent;
  let fixture: ComponentFixture<KubernetesServicePortsComponent>;

  beforeEach(waitForAsync(() => {
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
