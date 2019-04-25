import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { TabNavService } from '../../../../tab-nav.service';
import { createBasicStoreModule } from '../../../../test-framework/store-test-helper';
import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import { UserProfileService } from '../user-profile.service';
import { EditProfileInfoComponent } from './edit-profile-info.component';

describe('EditProfileInfoComponent', () => {
  let component: EditProfileInfoComponent;
  let fixture: ComponentFixture<EditProfileInfoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EditProfileInfoComponent],
      imports: [
        CommonModule,
        CoreModule,
        SharedModule,
        RouterTestingModule,
        BrowserAnimationsModule,
        createBasicStoreModule()
      ],
      providers: [UserProfileService, TabNavService],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditProfileInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
