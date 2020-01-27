import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesResourceViewerComponent } from './kubernetes-resource-viewer.component';

describe('KubernetesResourceViewerComponent', () => {
  let component: KubernetesResourceViewerComponent;
  let fixture: ComponentFixture<KubernetesResourceViewerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KubernetesResourceViewerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesResourceViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
