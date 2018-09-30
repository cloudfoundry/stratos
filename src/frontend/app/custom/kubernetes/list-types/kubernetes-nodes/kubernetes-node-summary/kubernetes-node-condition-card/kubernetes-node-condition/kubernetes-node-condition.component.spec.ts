import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesNodeConditionComponent } from './kubernetes-node-condition.component';

describe('KubernetesNodeConditionComponent', () => {
  let component: KubernetesNodeConditionComponent;
  let fixture: ComponentFixture<KubernetesNodeConditionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KubernetesNodeConditionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodeConditionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
