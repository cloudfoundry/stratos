import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesNodeTagsCardComponent } from './kubernetes-node-tags-card.component';

describe('KubernetesNodeTagsCardComponent', () => {
  let component: KubernetesNodeTagsCardComponent;
  let fixture: ComponentFixture<KubernetesNodeTagsCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KubernetesNodeTagsCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodeTagsCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
