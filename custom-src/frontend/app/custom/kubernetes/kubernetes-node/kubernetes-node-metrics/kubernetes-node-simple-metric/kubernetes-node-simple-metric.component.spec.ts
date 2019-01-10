import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesNodeSimpleMetricComponent } from './kubernetes-node-simple-metric.component';

describe('KubernetesNodeSimpleMetricComponent', () => {
  let component: KubernetesNodeSimpleMetricComponent;
  let fixture: ComponentFixture<KubernetesNodeSimpleMetricComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KubernetesNodeSimpleMetricComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodeSimpleMetricComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
