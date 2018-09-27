import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesNodeInfoCardComponent } from './kubernetes-node-info-card.component';

describe('KubernetesNodeInfoCardComponent', () => {
  let component: KubernetesNodeInfoCardComponent;
  let fixture: ComponentFixture<KubernetesNodeInfoCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KubernetesNodeInfoCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesNodeInfoCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
