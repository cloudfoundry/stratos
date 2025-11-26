import { ChangeDetectionStrategy, Component, type OnInit  } from '@angular/core';

import { IntroScreenComponent } from '../../../shared/components/intro-screen/intro-screen.component';
import { StratosTitleComponent } from '../../../shared/components/stratos-title/stratos-title.component';
import { ProductNameComponent } from '../../../shared/components/product-name.component';

@Component({
  selector: 'app-domain-mismatch',
  templateUrl: './domain-mismatch.component.html',
  styleUrls: ['./domain-mismatch.component.scss'],
  standalone: true,
  imports: [
    IntroScreenComponent,
    StratosTitleComponent,
    ProductNameComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DomainMismatchComponent implements OnInit {

  ngOnInit() {
    // Component initialization - no setup required
  }

}
