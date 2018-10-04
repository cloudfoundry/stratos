import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesNamespaceLinkComponent } from './kubernetes-namespace-link.component';

describe('KubernetesNamespaceLinkComponent', () => {
  let component: KubernetesNamespaceLinkComponent;
  let fixture: ComponentFixture<KubernetesNamespaceLinkComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KubernetesNamespaceLinkComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNamespaceLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
