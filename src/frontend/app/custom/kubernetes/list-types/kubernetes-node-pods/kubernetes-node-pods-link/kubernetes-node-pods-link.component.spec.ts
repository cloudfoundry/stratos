import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesNodePodsLinkComponent } from './kubernetes-node-pods-link.component';

describe('KubernetesNodePodsLinkComponent', () => {
  let component: KubernetesNodePodsLinkComponent;
  let fixture: ComponentFixture<KubernetesNodePodsLinkComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KubernetesNodePodsLinkComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodePodsLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
