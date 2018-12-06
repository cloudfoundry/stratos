import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditProfileInfoComponent } from './edit-profile-info.component';
import { CommonModule } from '@angular/common';
import { UserProfileService } from '../user-profile.service';
import { createBasicStoreModule } from '../../../test-framework/store-test-helper';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SharedModule } from '../../../shared/shared.module';
import { CoreModule } from '../../../core/core.module';
import { RouterTestingModule } from '@angular/router/testing';

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
      providers: [UserProfileService]
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
