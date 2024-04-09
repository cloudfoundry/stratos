import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import { KubernetesServicePortsComponent } from '../../kubernetes-service-ports/kubernetes-service-ports.component';
import { KubeServiceCardComponent } from './kubernetes-service-card.component';



describe('KubeServiceCardComponent', () => {
  let component: KubeServiceCardComponent;
  let fixture: ComponentFixture<KubeServiceCardComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        KubeServiceCardComponent,
        KubernetesServicePortsComponent,
      ],
      imports: [...KubernetesBaseTestModules],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubeServiceCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
