import { NgModule } from '@angular/core';
import { CoreModule } from '../../core/core.module';
import { CustomImportModule } from '../../custom-import.module';
import { SharedModule } from '../../shared/shared.module';
import { AboutPageComponent } from './about-page/about-page.component';
import { AboutRoutingModule } from './about.routing';
import { EulaPageComponent, EulaPageContentComponent } from './eula-page/eula-page.component';
import { DiagnosticsPageComponent } from './diagnostics-page/diagnostics-page.component';



@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    AboutRoutingModule,
    CustomImportModule
  ],
  declarations: [
    AboutPageComponent,
    EulaPageContentComponent,
    EulaPageComponent,
    DiagnosticsPageComponent
  ]
})
export class AboutModule { }

