import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesNodeMetricsComponent } from './kubernetes-node-metrics.component';

describe('KubernetesNodeMetricsComponent', () => {
  let component: KubernetesNodeMetricsComponent;
  let fixture: ComponentFixture<KubernetesNodeMetricsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KubernetesNodeMetricsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodeMetricsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
