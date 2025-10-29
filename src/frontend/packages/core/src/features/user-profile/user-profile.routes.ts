import { Routes } from '@angular/router';

import { EditProfileInfoComponent } from './edit-profile-info/edit-profile-info.component';
import { ProfileInfoComponent } from './profile-info/profile-info.component';

export const USER_PROFILE_ROUTES: Routes = [{
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
