import { BehaviorSubject } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Component, OnInit, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { KubernetesEndpointService } from '../services/kubernetes-endpoint.service';
import { BaseKubeGuid } from '../kubernetes-page.types';
import { ActivatedRoute } from '@angular/router';
import { KubernetesService } from '../services/kubernetes.service';

@Component({
  selector: 'app-kubernetes-dashboard',
  templateUrl: './kubernetes-dashboard.component.html',
  styleUrls: ['./kubernetes-dashboard.component.scss'],
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
export class KubernetesDashboardTabComponent implements OnInit {

  @ViewChild('kubeDash', {read: ElementRef}) kubeDash: ElementRef;

  source: SafeResourceUrl;
  isLoading$ = new BehaviorSubject<boolean>(true);
  expanded = false;

  searchTerms: any;

  href = '';

  constructor(public kubeEndpointService: KubernetesEndpointService, private sanitizer: DomSanitizer, public renderer: Renderer2) { }

  ngOnInit() {
    const guid = this.kubeEndpointService.baseKube.guid;

    let href = window.location.href;
    const index = href.indexOf('dashboard');
    href = href.substr(index + 9);
    href = decodeURI(href);
    this.href = '#!' + href;
    this.source = this.sanitizer.bypassSecurityTrustResourceUrl(`/pp/v1/kubedash/${guid}/`);
  }

  iframeLoaded() {
    const kdToolbar = this.getKubeDashToolbar();
    if (!!kdToolbar) {
      this.isLoading$.next(false);
      this.toggle(false);
    }

    const iframeWindow = this.kubeDash.nativeElement.contentWindow;
    console.log('iframe loaded');

    iframeWindow.addEventListener('hashchange', () => {
      //Object.defineProperty( event, "oldURL", { enumerable: true, configurable: true, value: lastURL } );
      //Object.defineProperty( event, "newURL", { enumerable: true, configurable: true, value: document.URL } );
      //lastURL = document.URL;
      console.log('NAV IFRAME');
      //console.log(event);

      console.log(iframeWindow.location);

      if (this.href) {
        iframeWindow.location.hash = this.href;
        this.href = '';
      }
    });

  }

  toggle(val: boolean) {
    if (val !== undefined) {
      this.expanded = val;
    } else {
      this.expanded = !this.expanded;
    }

    const height = this.expanded ? '48px' : '0px';
    const kdToolbar = this.getKubeDashToolbar();
    if (!!kdToolbar) {
      this.renderer.setStyle(kdToolbar, 'height', height);
      this.renderer.setStyle(kdToolbar, 'minHeight', height);
    }
  }

  private getKubeDashToolbar() {
    if (this.kubeDash.nativeElement &&
      this.kubeDash.nativeElement.contentDocument &&
      this.kubeDash.nativeElement.contentDocument.getElementsByTagName ) {
      const kdChrome = this.kubeDash.nativeElement.contentDocument.getElementsByTagName('kd-chrome')[0];
      if (kdChrome) {
        const kdToolbar = kdChrome.getElementsByTagName('md-toolbar')[0];
        return kdToolbar;
      }
    }
    return null;
  }

}
