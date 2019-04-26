import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabNavService } from '../../../../tab-nav.service';
import { KubernetesBaseTestModules } from '../kubernetes.testing.module';
import { PodMetricsComponent } from './pod-metrics.component';


describe('PodMetricsComponent', () => {
  let component: PodMetricsComponent;
  let fixture: ComponentFixture<PodMetricsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PodMetricsComponent],
      imports: KubernetesBaseTestModules,
      providers: [TabNavService]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PodMetricsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
