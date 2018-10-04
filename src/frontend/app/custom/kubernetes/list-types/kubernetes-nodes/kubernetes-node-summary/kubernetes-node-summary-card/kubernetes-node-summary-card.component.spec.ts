import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesNodeSummaryCardComponent } from './kubernetes-node-summary-card.component';

describe('KubernetesNodeSummaryCardComponent', () => {
  let component: KubernetesNodeSummaryCardComponent;
  let fixture: ComponentFixture<KubernetesNodeSummaryCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KubernetesNodeSummaryCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodeSummaryCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
