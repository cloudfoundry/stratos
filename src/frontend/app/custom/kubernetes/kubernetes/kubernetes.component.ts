import { Component, OnInit } from '@angular/core';
import { KubernetesService } from '../services/kubernetes.service';
import { Store } from '@ngrx/store';
import { map, filter, first } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AppState } from '../../../store/app-state';
import { RouterNav } from '../../../store/actions/router.actions';

@Component({
  selector: 'app-kubernetes',
  templateUrl: './kubernetes.component.html',
  styleUrls: ['./kubernetes.component.scss']
})
export class KubernetesComponent implements OnInit {

  hasOneKube$: Observable<boolean>;
  constructor(
    private store: Store<AppState>,
    private kubeService: KubernetesService
  ) {
    this.hasOneKube$ = kubeService.kubeEndpoints$.pipe(
      map(cfEndpoints => {
        const connectedEndpoints = cfEndpoints.filter(
          c => c.connectionStatus === 'connected'
        );
        const hasOne = connectedEndpoints.length === 1;
        if (hasOne) {
          this.store.dispatch(new RouterNav({
            path: ['kubernetes', connectedEndpoints[0].guid]
          }));
        }
        return connectedEndpoints.length === 1;
      }),
      filter(hasOne => !hasOne),
      first()
    );
  }

  ngOnInit() {
  }
}
