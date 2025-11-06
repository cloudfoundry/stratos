import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { UserProfileBannerComponent } from './user-profile-banner.component';
import { CoreModule } from '../../../core/core.module';

describe('UserProfileBannerComponent', () => {
  let component: UserProfileBannerComponent;
  let fixture: ComponentFixture<UserProfileBannerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        UserProfileBannerComponent,
        CoreModule,
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserProfileBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
