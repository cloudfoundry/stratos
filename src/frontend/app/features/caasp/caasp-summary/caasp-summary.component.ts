import { Component, OnInit } from '@angular/core';
import { endpointEntitiesSelector } from '../../../store/selectors/endpoint.selectors';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';
import { Http } from '@angular/http';
import { tap } from 'rxjs/operators';
import { ListConfig } from '../../../shared/components/list/list.component.types';
import { GetCaaspInfo } from '../../../store/actions/caasp.actions';

@Component({
  selector: 'app-caasp-summary',
  templateUrl: './caasp-summary.component.html',
  styleUrls: ['./caasp-summary.component.scss'],
  // providers: [{
  //   provide: ListConfig,
  //   useClass: CaaspNodesListConfigService,
  // }]
})
export class CaaspSummaryComponent implements OnInit {

  metadata: any;
  // stats: {
  //   total: 0,
  //   masters: 0,
  //   workers: 0,
  // };
  stats: any;

  constructor(private http: Http, private store: Store<AppState>, private activatedRoute: ActivatedRoute) {}

  ngOnInit() {
    //this.fetch();

    const { caaspId } = this.activatedRoute.snapshot.params;
    this.store.dispatch(new GetCaaspInfo(caaspId));

    //this.store.dispatch(new LoggerDebugAction(message));

  }

  // fetch() {
  //   const { caaspId } = this.activatedRoute.snapshot.params;

  //   // Fetch metadata and store
  //   const info$ = this.http.get('/pp/v1/caasp/' + caaspId + '/info');
  //   info$.pipe(
  //     tap(p => {
  //       if (p.ok) {
  //         this.metadata = p.json();
  //       } else {
  //         this.metadata = {};
  //       }
  //       console.log(this.metadata);

  //       const nodes = this.metadata.assigned_minions ? this.metadata.assigned_minions : [];
  //       this.stats = {};
  //       this.stats.total = nodes.length;
  //       this.stats.masters = nodes.filter(item => item.role === 'master').length;
  //       this.stats.workers = nodes.filter(item => item.role === 'worker').length;
  //     })
  //   ).subscribe()
  // }

  downloadKubeConfig() {
    const { caaspId } = this.activatedRoute.snapshot.params;
    const url = "/pp/v1/caasp/" + caaspId + "/kubeConfig?kubeconfig.yaml";
    window.open(url, "_download");
  }
}
