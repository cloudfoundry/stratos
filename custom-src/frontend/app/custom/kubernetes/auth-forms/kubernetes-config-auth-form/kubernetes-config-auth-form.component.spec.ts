import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesConfigAuthFormComponent } from './kubernetes-config-auth-form.component';

describe('KubernetesConfigAuthFormComponent', () => {
  let component: KubernetesConfigAuthFormComponent;
  let fixture: ComponentFixture<KubernetesConfigAuthFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KubernetesConfigAuthFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesConfigAuthFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
