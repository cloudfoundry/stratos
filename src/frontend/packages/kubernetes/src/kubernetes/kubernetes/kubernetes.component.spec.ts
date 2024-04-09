import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TabNavService } from '../../../../core/src/tab-nav.service';
import { KubernetesBaseTestModules } from '../kubernetes.testing.module';
import { KubernetesComponent } from './kubernetes.component';

describe('KubernetesComponent', () => {
  let component: KubernetesComponent;
  let fixture: ComponentFixture<KubernetesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [KubernetesComponent],
      imports: KubernetesBaseTestModules,
      providers: [TabNavService]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
