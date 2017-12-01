import { ListConfig } from '../../../shared/components/list/list.component';
import { CfAppConfigService } from '../../../shared/list-configs/cf-app-config.service';
import { CardAppComponent } from '../../../shared/components/cards/custom-cards/card-app/card-app.component';
import { Component } from '@angular/core';
import { animate, query, style, transition, trigger } from '@angular/animations';
@Component({
  selector: 'app-application-wall',
  templateUrl: './application-wall.component.html',
  styleUrls: ['./application-wall.component.scss'],
  animations: [
    trigger(
      'cardEnter', [
        transition('* => *', [
          query(':enter', [
            style({ opacity: 0, transform: 'translateY(10px)' }),
            animate('150ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ], { optional: true })
        ])
      ]
    )
  ],
  providers: [{
    provide: ListConfig,
    useClass: CfAppConfigService
  }]
})
export class ApplicationWallComponent {

  constructor() { }
  cardComponent = CardAppComponent;
}
