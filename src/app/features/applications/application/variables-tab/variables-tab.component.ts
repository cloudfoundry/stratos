import { Component, OnInit, ViewChild, ElementRef, OnDestroy, EventEmitter } from '@angular/core';
import { ApplicationService } from '../../application.service';
import { Observable, Subscription } from 'rxjs/Rx';
import { DataSource } from '@angular/cdk/table';
import { MdPaginator, PageEvent, MdSort, Sort, MdInput } from '@angular/material';

import { UpdateApplication, ApplicationSchema } from '../../../../store/actions/application.actions';
import { ActionState } from '../../../../store/reducers/api-request-reducer';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../store/app-state';
import { NgModel } from '@angular/forms';
import { AppMetadataInfo } from '../../../../store/types/app-metadata.types';
import { EntityInfo } from '../../../../store/types/api.types';
import { CfAppEvnVarsDataSource } from '../../../../shared/data-sources/cf-app-variables-data-source';


@Component({
  selector: 'app-variables-tab',
  templateUrl: './variables-tab.component.html',
  styleUrls: ['./variables-tab.component.scss']
})
export class VariablesTabComponent implements OnInit {

  constructor(private store: Store<AppState>, private appService: ApplicationService) { }


  envVarsDataSource: CfAppEvnVarsDataSource;

  envVars$: Observable<any>;

  ngOnInit() {
    this.envVarsDataSource = new CfAppEvnVarsDataSource(this.store, this.appService);
    this.envVars$ = this.appService.appEnvVars$;
  }
}
