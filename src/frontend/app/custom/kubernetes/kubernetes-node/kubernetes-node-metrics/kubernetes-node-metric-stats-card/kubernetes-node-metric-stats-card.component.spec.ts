import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesNodeMetricStatsCardComponent } from './kubernetes-node-metric-stats-card.component';

describe('KubernetesNodeMetricStatsCardComponent', () => {
  let component: KubernetesNodeMetricStatsCardComponent;
  let fixture: ComponentFixture<KubernetesNodeMetricStatsCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KubernetesNodeMetricStatsCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodeMetricStatsCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
