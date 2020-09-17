import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { EditProfileInfoComponent } from './edit-profile-info/edit-profile-info.component';
import { ProfileInfoComponent } from './profile-info/profile-info.component';

const userProfile: Routes = [{
  path: '',
  children: [
    {
      path: '',
      component: ProfileInfoComponent,
    },
    {
      path: 'edit',
      component: EditProfileInfoComponent,
    }
  ]
}];

@NgModule({
  imports: [RouterModule.forChild(userProfile)]
})
export class UserProfileRoutingModule { }
