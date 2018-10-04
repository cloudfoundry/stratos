import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesNamespaceComponent } from './kubernetes-namespace.component';

describe('KubernetesNamespaceComponent', () => {
  let component: KubernetesNamespaceComponent;
  let fixture: ComponentFixture<KubernetesNamespaceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KubernetesNamespaceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNamespaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
