import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppLinkComponent } from './app-link.component';
import { BaseTestModules } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';

describe('AppLinkComponent', () => {
  let component: AppLinkComponent<any>;
  let fixture: ComponentFixture<AppLinkComponent<any>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AppLinkComponent],
      imports: BaseTestModules
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
