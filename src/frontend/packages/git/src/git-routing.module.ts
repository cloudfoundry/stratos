import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { GIT_ROUTES } from './git.routes';

@NgModule({
  imports: [
    RouterModule.forChild(GIT_ROUTES),
  ],
})
export class GitRoutingModule { }
