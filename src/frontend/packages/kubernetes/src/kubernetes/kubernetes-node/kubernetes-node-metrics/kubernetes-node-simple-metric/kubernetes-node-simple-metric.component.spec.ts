import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { KubernetesNodeSimpleMetricComponent } from './kubernetes-node-simple-metric.component';

describe('KubernetesNodeSimpleMetricComponent', () => {
  let component: KubernetesNodeSimpleMetricComponent;
  let fixture: ComponentFixture<KubernetesNodeSimpleMetricComponent>;

  beforeEach(waitForAsync(() => {
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
