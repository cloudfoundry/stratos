import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesPodTagsComponent } from './kubernetes-pod-tags.component';

describe('KubernetesPodTagsComponent', () => {
  let component: KubernetesPodTagsComponent;
  let fixture: ComponentFixture<KubernetesPodTagsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KubernetesPodTagsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesPodTagsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
