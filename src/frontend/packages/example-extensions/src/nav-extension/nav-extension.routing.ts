import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ExampleComponent } from './example-component/example.component';

const routes: Routes = [{
  path: '',
  title: 'Example Navigation Extension',
  component: ExampleComponent,
}];

@NgModule({
  imports: [RouterModule.forChild(routes)]
})
export class NavExtensionRoutingModule { }

