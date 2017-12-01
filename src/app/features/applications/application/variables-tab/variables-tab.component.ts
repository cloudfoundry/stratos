import { Store } from '@ngrx/store';
import { AppState } from '../../../../store/app-state';
import { ApplicationService } from '../../application.service';
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Rx';
import {
  CardAppVariableComponent,
} from '../../../../shared/components/cards/custom-cards/card-app-variable/card-app-variable.component';

@Component({
  selector: 'app-variables-tab',
  templateUrl: './variables-tab.component.html',
  styleUrls: ['./variables-tab.component.scss']
})
export class VariablesTabComponent implements OnInit {

  constructor(private store: Store<AppState>, private appService: ApplicationService) { }

  envVars$: Observable<any>;
  cardComponent = CardAppVariableComponent;

  ngOnInit() {
    this.envVars$ = this.appService.appEnvVars$;
  }

}
