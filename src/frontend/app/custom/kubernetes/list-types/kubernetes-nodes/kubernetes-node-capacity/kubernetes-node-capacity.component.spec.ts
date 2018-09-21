import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesNodeCapacityComponent } from './kubernetes-node-capacity.component';

describe('KubernetesNodeUsageComponent', () => {
  let component: KubernetesNodeCapacityComponent<any>;
  let fixture: ComponentFixture<KubernetesNodeCapacityComponent<any>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KubernetesNodeCapacityComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodeCapacityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
