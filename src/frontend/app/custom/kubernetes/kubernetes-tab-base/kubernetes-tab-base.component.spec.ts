import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesTabBaseComponent } from './kubernetes-tab-base.component';
import { BaseTestModules } from '../../../test-framework/cloud-foundry-endpoint-service.helper';

describe('KubernetesTabBaseComponent', () => {
  let component: KubernetesTabBaseComponent;
  let fixture: ComponentFixture<KubernetesTabBaseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [KubernetesTabBaseComponent],
      imports: BaseTestModules
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
