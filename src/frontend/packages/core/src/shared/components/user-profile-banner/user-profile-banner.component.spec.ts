import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { UserProfileBannerComponent } from './user-profile-banner.component';
import { MDAppModule } from '../../../core/md.module';
import { CoreModule } from '../../../core/core.module';

describe('UserProfileBannerComponent', () => {
  let component: UserProfileBannerComponent;
  let fixture: ComponentFixture<UserProfileBannerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ UserProfileBannerComponent ],
      imports: [
        CoreModule,
        MDAppModule
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserProfileBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
