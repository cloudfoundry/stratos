import { animate, style, transition, trigger } from '@angular/animations';
import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Rx';

@Component({
  selector: 'app-loading-page',
  templateUrl: './loading-page.component.html',
  styleUrls: ['./loading-page.component.scss'],
  animations: [
    trigger(
      'leaveLoaderAnimation', [
        transition(':leave', [
          style({ opacity: 1 }),
          animate('250ms ease-out', style({ opacity: 0 }))
        ])
      ]
    )
  ]
})
export class LoadingPageComponent implements OnInit {

  constructor() { }

  @Input('isLoading')
  isLoading: Observable<boolean> = Observable.of(false);

  @Input('text')
  text = 'Getting your data';

  done: boolean;

  ngOnInit() {
    this.isLoading
      .mergeMap(loading => {
        this.done = !loading;
        return Observable.of(loading);
      })
      .filter(loading => !loading)
      .take(1)
      .subscribe();
  }

}
