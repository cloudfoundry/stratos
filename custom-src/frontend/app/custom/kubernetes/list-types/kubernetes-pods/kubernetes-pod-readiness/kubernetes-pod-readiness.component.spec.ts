import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesPodReadinessComponent } from './kubernetes-pod-readiness.component';

describe('KubernetesPodReadinessComponent', () => {
  let component: KubernetesPodReadinessComponent;
  let fixture: ComponentFixture<KubernetesPodReadinessComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KubernetesPodReadinessComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesPodReadinessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
