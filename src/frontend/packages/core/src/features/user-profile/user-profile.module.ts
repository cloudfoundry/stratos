import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileInfoComponent } from './profile-info/profile-info.component';
import { UserProfileRoutingModule } from './user-profile.routing';
import { SharedModule } from '../../shared/shared.module';
import { CoreModule } from '../../core/core.module';
import { EditProfileInfoComponent } from './edit-profile-info/edit-profile-info.component';
import { UserProfileService } from '../../core/user-profile.service';

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
