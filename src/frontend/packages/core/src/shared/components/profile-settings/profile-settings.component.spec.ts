import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { BaseTestModules } from '../../../../test-framework/core-test.helper';
import { ProfileSettingsComponent } from './profile-settings.component';

describe('ProfileSettingsComponent', () => {
  let component: ProfileSettingsComponent;
  let fixture: ComponentFixture<ProfileSettingsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: BaseTestModules,
      declarations: [ ProfileSettingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
