import { Component, Input } from '@angular/core';

@Component({
  selector: 'mat-card',
  templateUrl: './custom-card.component.html',
  styleUrls: ['./custom-card.component.scss'],
  standalone: false
})
export class CustomCardComponent {
  @Input() appearance: 'raised' | 'outlined' = 'raised';
}

@Component({
  selector: 'mat-card-header',
  template: '<div class="custom-card-header"><ng-content></ng-content></div>',
  styleUrls: ['./custom-card.component.scss'],
  standalone: false
})
export class CustomCardHeaderComponent {
}

@Component({
  selector: 'mat-card-title',
  template: '<div class="custom-card-title"><ng-content></ng-content></div>',
  styleUrls: ['./custom-card.component.scss'],
  standalone: false
})
export class CustomCardTitleComponent {
}

@Component({
  selector: 'mat-card-subtitle',
  template: '<div class="custom-card-subtitle"><ng-content></ng-content></div>',
  styleUrls: ['./custom-card.component.scss'],
  standalone: false
})
export class CustomCardSubtitleComponent {
}

@Component({
  selector: 'mat-card-content',
  template: '<div class="custom-card-content"><ng-content></ng-content></div>',
  styleUrls: ['./custom-card.component.scss'],
  standalone: false
})
export class CustomCardContentComponent {
}

@Component({
  selector: 'mat-card-actions',
  template: '<div class="custom-card-actions"><ng-content></ng-content></div>',
  styleUrls: ['./custom-card.component.scss'],
  standalone: false
})
export class CustomCardActionsComponent {
  @Input() align: 'start' | 'end' = 'start';
}

@Component({
  selector: 'mat-card-footer',
  template: '<div class="custom-card-footer"><ng-content></ng-content></div>',
  styleUrls: ['./custom-card.component.scss'],
  standalone: false
})
export class CustomCardFooterComponent {
}