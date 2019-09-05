import { NgModule } from '@angular/core';
import { AppChipsComponent } from './components/chips/chips.component';
import { BooleanIndicatorComponent } from './components/boolean-indicator/boolean-indicator.component';
import { CodeBlockComponent } from './components/code-block/code-block.component';
import { StratosTitleComponent } from './components/stratos-title/stratos-title.component';

@NgModule({
  imports: [],
  declarations: [
    AppChipsComponent,
    BooleanIndicatorComponent,
    CodeBlockComponent,
    StratosTitleComponent,
  ],
  exports: [
    AppChipsComponent,
    BooleanIndicatorComponent,
    CodeBlockComponent,
    StratosTitleComponent,
  ]
})
export class StratosComponentsModule {

  constructor() {
    console.log('Stratos Components Module loaded');
  }
 }
