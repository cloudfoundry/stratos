import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabNavService } from '../../../../tab-nav.service';
import { KubernetesBaseTestModules } from '../kubernetes.testing.module';
import { KubernetesTabBaseComponent } from './kubernetes-tab-base.component';

describe('KubernetesTabBaseComponent', () => {
  let component: KubernetesTabBaseComponent;
  let fixture: ComponentFixture<KubernetesTabBaseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [KubernetesTabBaseComponent],
      imports: KubernetesBaseTestModules,
      providers: [TabNavService]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesTabBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
