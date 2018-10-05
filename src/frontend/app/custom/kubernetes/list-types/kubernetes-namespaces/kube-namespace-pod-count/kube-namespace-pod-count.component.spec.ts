import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubeNamespacePodCountComponent } from './kube-namespace-pod-count.component';

describe('KubeNamespacePodCountComponent', () => {
  let component: KubeNamespacePodCountComponent;
  let fixture: ComponentFixture<KubeNamespacePodCountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KubeNamespacePodCountComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubeNamespacePodCountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
