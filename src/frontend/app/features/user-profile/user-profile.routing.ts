import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfileInfoComponent } from './profile-info/profile-info.component';

const userProfile: Routes = [{
  path: '',
  component: ProfileInfoComponent,
}];

@NgModule({
  imports: [RouterModule.forChild(userProfile)]
})
export class UserProfileRoutingModule { }
