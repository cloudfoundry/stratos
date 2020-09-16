import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CoreModule } from '../../core/core.module';
import { UserProfileService } from '../../core/user-profile.service';
import { SharedModule } from '../../shared/shared.module';
import { EditProfileInfoComponent } from './edit-profile-info/edit-profile-info.component';
import { ProfileInfoComponent } from './profile-info/profile-info.component';
import { UserProfileRoutingModule } from './user-profile.routing';

@NgModule({
  imports: [
    CommonModule,
    CoreModule,
    SharedModule,
    UserProfileRoutingModule
  ],
  declarations: [ProfileInfoComponent, EditProfileInfoComponent],
  providers: [
    UserProfileService
  ]
})
export class UserProfileModule { }
