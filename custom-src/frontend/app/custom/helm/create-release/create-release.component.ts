import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription, of as observableOf } from 'rxjs';

@Component({
  selector: 'app-create-release',
  templateUrl: './create-release.component.html',
  styleUrls: ['./create-release.component.scss'],
})
export class CreateReleaseComponent implements OnInit, OnDestroy {

  isLoading$ = observableOf(false);
  paginationStateSub: Subscription;
  constructor(
    private route: ActivatedRoute,
  ) { }

  ngOnInit() {
    console.log('Create Release Component');
  }
  ngOnDestroy(): void {
  }

}
