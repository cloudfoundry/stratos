import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesNodeSummaryComponent } from './kubernetes-node-summary.component';

describe('KubernetesNodeSummaryComponent', () => {
  let component: KubernetesNodeSummaryComponent;
  let fixture: ComponentFixture<KubernetesNodeSummaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KubernetesNodeSummaryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodeSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
