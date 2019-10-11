import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import { AppLinkComponent } from './app-link.component';

describe('AppLinkComponent', () => {
  let component: AppLinkComponent<any>;
  let fixture: ComponentFixture<AppLinkComponent<any>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AppLinkComponent],
      imports: KubernetesBaseTestModules
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppLinkComponent);
    component = fixture.componentInstance;
    const testString = 'test';
    component.row = {
      kubeId: testString,
      name: testString,
      pods: [],
      createdAt: (new Date()),
      status: testString,
      version: testString,
      chartName: testString,
      appVersion: testString,
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
