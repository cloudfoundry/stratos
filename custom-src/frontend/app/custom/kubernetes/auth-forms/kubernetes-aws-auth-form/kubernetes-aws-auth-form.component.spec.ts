import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesAWSAuthFormComponent } from './kubernetes-awsauth-form.component';

describe('KubernetesAWSAuthFormComponent', () => {
  let component: KubernetesAWSAuthFormComponent;
  let fixture: ComponentFixture<KubernetesAWSAuthFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KubernetesAWSAuthFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesAWSAuthFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
