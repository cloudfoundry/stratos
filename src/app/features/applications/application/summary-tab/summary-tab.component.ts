import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';

import { AppState } from '../../../../store/app-state';
import { getEntity } from '../../../../store/actions/api.actions';
import { ApplicationSchema, GetApplication } from '../../../../store/actions/application.actions';
import { ApplicationService } from '../../application.service';

@Component({
  selector: 'app-summary-tab',
  templateUrl: './summary-tab.component.html',
  styleUrls: ['./summary-tab.component.scss']
})
export class SummaryTabComponent implements OnInit, OnDestroy {
  
    constructor(private applicationService: ApplicationService) { }

    application;
  
    sub: Subscription;

    ngOnInit() {
      this.sub = this.applicationService.GetApplication().subscribe(application => {
        this.application = application;
      });
    }
  
    ngOnDestroy() {
      // TODO: RC? Thinking this over, is there no metadata we can assign to the param for this to be auto unsubed at the end of the component liftime?
      // Otherwise this is gonna pop up in every single component
      this.sub.unsubscribe();
    }
  
  }