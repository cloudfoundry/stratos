import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesNodeConditionCardComponent } from './kubernetes-node-condition-card.component';

describe('KubernetesNodeConditionCardComponent', () => {
  let component: KubernetesNodeConditionCardComponent;
  let fixture: ComponentFixture<KubernetesNodeConditionCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KubernetesNodeConditionCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodeConditionCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
