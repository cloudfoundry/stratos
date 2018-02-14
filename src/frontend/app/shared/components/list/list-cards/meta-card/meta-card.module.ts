import { NgModule } from '@angular/core';

import { MetaCardComponent } from './meta-card-base/meta-card.component';
import { MetaCardTitleComponent } from './meta-card-title/meta-card-title.component';
import { MetaCardItemComponent } from './meta-card-item/meta-card-item.component';
import { MetaCardKeyComponent } from './meta-card-key/meta-card-key.component';
import { MetaCardValueComponent } from './meta-card-value/meta-card-value.component';

@NgModule({
  declarations: [
    MetaCardComponent,
    MetaCardTitleComponent,
    MetaCardItemComponent,
    MetaCardKeyComponent,
    MetaCardValueComponent
  ],
  exports: [
    MetaCardComponent,
    MetaCardTitleComponent,
    MetaCardItemComponent,
    MetaCardKeyComponent,
    MetaCardValueComponent
  ]
})
export class MetaCardModule { }
