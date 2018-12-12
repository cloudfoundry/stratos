import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesCertsAuthFormComponent } from './kubernetes-certs-auth-form.component';

describe('KubernetesCertsAuthFormComponent', () => {
  let component: KubernetesCertsAuthFormComponent;
  let fixture: ComponentFixture<KubernetesCertsAuthFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KubernetesCertsAuthFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesCertsAuthFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
