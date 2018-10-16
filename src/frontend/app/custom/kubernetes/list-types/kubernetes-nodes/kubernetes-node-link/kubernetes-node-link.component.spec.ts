import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesNodeLinkComponent } from './kubernetes-node-link.component';

describe('KubernetesNodeLinkComponent', () => {
  let component: KubernetesNodeLinkComponent<any>;
  let fixture: ComponentFixture<KubernetesNodeLinkComponent<any>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [KubernetesNodeLinkComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodeLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
