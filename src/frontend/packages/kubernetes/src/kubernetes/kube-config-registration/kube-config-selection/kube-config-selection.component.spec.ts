import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { KubernetesBaseTestModules } from '../../kubernetes.testing.module';
import { KubeConfigSelectionComponent } from './kube-config-selection.component';

describe('KubeConfigSelectionComponent', () => {
  let component: KubeConfigSelectionComponent;
  let fixture: ComponentFixture<KubeConfigSelectionComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        ...KubernetesBaseTestModules
      ],
      declarations: [KubeConfigSelectionComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubeConfigSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
