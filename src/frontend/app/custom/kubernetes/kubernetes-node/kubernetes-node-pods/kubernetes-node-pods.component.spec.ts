import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesNodePodsComponent } from './kubernetes-node-pods.component';

describe('KubernetesNodePodsComponent', () => {
  let component: KubernetesNodePodsComponent;
  let fixture: ComponentFixture<KubernetesNodePodsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KubernetesNodePodsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodePodsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
