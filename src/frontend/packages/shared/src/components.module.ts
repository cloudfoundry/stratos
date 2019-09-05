import { NgModule } from '@angular/core';
import { AppChipsComponent } from './components/chips/chips.component';
import { BooleanIndicatorComponent } from './components/boolean-indicator/boolean-indicator.component';
import { CodeBlockComponent } from './components/code-block/code-block.component';
import { DateTimeComponent } from './components/date-time/date-time.component';
import { StratosTitleComponent } from './components/stratos-title/stratos-title.component';
import { CapitalizeFirstPipe } from './pipes/capitalizeFirstLetter.pipe';
import { MbToHumanSizePipe } from './pipes/mb-to-human-size.pipe';
import { PercentagePipe } from './pipes/percentage.pipe';
import { UptimePipe } from './pipes/uptime.pipe';
import { UsageBytesPipe } from './pipes/usage-bytes.pipe';
import { ValuesPipe } from './pipes/values.pipe';

@NgModule({
  imports: [],
  declarations: [
    AppChipsComponent,
    BooleanIndicatorComponent,
    CodeBlockComponent,
    DateTimeComponent,
    StratosTitleComponent,
    CapitalizeFirstPipe,
    MbToHumanSizePipe,
    PercentagePipe,
    UptimePipe,
    UsageBytesPipe,
    ValuesPipe,
  ],
  exports: [
    AppChipsComponent,
    BooleanIndicatorComponent,
    CodeBlockComponent,
    DateTimeComponent,
    StratosTitleComponent,
    CapitalizeFirstPipe,
    MbToHumanSizePipe,
    ValuesPipe,
    PercentagePipe,
    UsageBytesPipe,
    UptimePipe,

  ]
})
export class StratosComponentsModule {

  constructor() {
    console.log('Stratos Components Module loaded');
  }
 }
