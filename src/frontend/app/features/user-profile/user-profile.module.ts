import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileInfoComponent } from './profile-info/profile-info.component';
import { UserProfileRoutingModule } from './user-profile.routing';
import { SharedModule } from '../../shared/shared.module';
import { CoreModule } from '../../core/core.module';

@NgModule({
  imports: [
    CommonModule,
    CoreModule,
    SharedModule,
    UserProfileRoutingModule
  ],
  declarations: [ProfileInfoComponent]
})
export class UserProfileModule { }
