import { BehaviorSubject, Observable } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Component, OnInit, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { KubernetesEndpointService } from '../services/kubernetes-endpoint.service';
import { BaseKubeGuid } from '../kubernetes-page.types';
import { ActivatedRoute } from '@angular/router';
import { KubernetesService } from '../services/kubernetes.service';
import { IHeaderBreadcrumb } from '../../../shared/components/page-header/page-header.types';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-kubernetes-svcproxy',
  templateUrl: './kubernetes-svcproxy.component.html',
  styleUrls: ['./kubernetes-svcproxy.component.scss'],
  providers: [
    {
      provide: BaseKubeGuid,
      useFactory: (activatedRoute: ActivatedRoute) => {
        return {
          guid: activatedRoute.snapshot.params.endpointId
        };
      },
      deps: [
        ActivatedRoute
      ]
    },
    KubernetesService,
    KubernetesEndpointService,
  ]
})
export class KubernetesServiceProxyComponent implements OnInit {

  @ViewChild('kubeDash', {read: ElementRef}) kubeDash: ElementRef;

  source: SafeResourceUrl;
  isLoading$ = new BehaviorSubject<boolean>(true);

  href = '';

  public breadcrumbs$: Observable<IHeaderBreadcrumb[]>;

  constructor(public kubeEndpointService: KubernetesEndpointService, private sanitizer: DomSanitizer, public renderer: Renderer2) { }

  ngOnInit() {
    const guid = this.kubeEndpointService.baseKube.guid;

    let href = window.location.href;
    const index = href.indexOf('svcproxy');
    href = href.substr(index + 9);
    console.log(href);
    this.href = href;
    const url = `/pp/v1/kubesvc/${guid}/${href}/`;
    console.log(url);
    this.source = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    console.log(window.location);

    this.breadcrumbs$ = this.kubeEndpointService.endpoint$.pipe(
      map(endpoint => ([{
        breadcrumbs: [
          { value: endpoint.entity.name, routerLink: `/kubernetes/${endpoint.entity.guid}` },
        ]
      }])
      )
    );
  }

  iframeLoaded() {
    const iframeWindow = this.kubeDash.nativeElement.contentWindow;
    console.log('iframe loaded');
    this.isLoading$.next(false);

    iframeWindow.addEventListener('hashchange', () => {
      console.log('iframe hashchange');
      console.log(iframeWindow.location);
      console.log(this.href);

      if (this.href) {
        let h2 = decodeURI(this.href);
        h2 = decodeURI(h2);

        h2 = h2.replace('%3F', '?');
        h2 = h2.replace('%3D', '=');
        console.log(h2);
        h2 = '#!' + h2;
        console.log('Changing location hash');
        iframeWindow.location.hash = h2;
        this.href = '';
      }
    });

  }

}
