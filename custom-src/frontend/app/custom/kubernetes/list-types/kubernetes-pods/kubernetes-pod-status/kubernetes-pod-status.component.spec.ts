import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesPodStatusComponent } from './kubernetes-pod-status.component';

describe('KubernetesPodStatusComponent', () => {
  let component: KubernetesPodStatusComponent;
  let fixture: ComponentFixture<KubernetesPodStatusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KubernetesPodStatusComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesPodStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
