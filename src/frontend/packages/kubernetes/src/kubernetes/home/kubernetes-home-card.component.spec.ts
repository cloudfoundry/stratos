import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesEndpointService } from '../services/kubernetes-endpoint.service';
import { KubernetesHomeCardComponent } from './kubernetes-home-card.component';

describe('KubernetesHomeCardComponent', () => {
  let component: KubernetesHomeCardComponent;
  let fixture: ComponentFixture<KubernetesHomeCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KubernetesHomeCardComponent ],
      providers: [ KubernetesEndpointService ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesHomeCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
