import { ChangeDetectionStrategy, Component  } from '@angular/core';

import { IntroScreenComponent } from '../../../shared/components/intro-screen/intro-screen.component';
import { StratosTitleComponent } from '../../../shared/components/stratos-title/stratos-title.component';
import { ProductNameComponent } from '../../../shared/components/product-name.component';

@Component({
  selector: 'app-upgrade-page',
  templateUrl: './upgrade-page.component.html',
  styleUrls: ['./upgrade-page.component.scss'],
  standalone: true,
  imports: [
    IntroScreenComponent,
    StratosTitleComponent,
    ProductNameComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpgradePageComponent {

}
