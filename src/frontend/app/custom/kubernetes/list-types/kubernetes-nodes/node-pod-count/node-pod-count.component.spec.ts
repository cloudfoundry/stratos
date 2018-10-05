import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NodePodCountComponent } from './node-pod-count.component';

describe('NodePodCountComponent', () => {
  let component: NodePodCountComponent;
  let fixture: ComponentFixture<NodePodCountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NodePodCountComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NodePodCountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
