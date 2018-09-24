import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesNodeComponent } from './kubernetes-node.component';

describe('KubernetesNodeComponent', () => {
  let component: KubernetesNodeComponent;
  let fixture: ComponentFixture<KubernetesNodeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KubernetesNodeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
