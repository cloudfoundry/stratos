import { Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  EndpointMissingMessageParts,
} from '../../../../../core/src/shared/components/endpoints-missing/endpoints-missing.component';
import { IHeaderBreadcrumb } from '../../../../../core/src/shared/components/page-header/page-header.types';
import { BaseKubeGuid } from '../kubernetes-page.types';
import { KubernetesEndpointService } from '../services/kubernetes-endpoint.service';
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

  private pKubeDash: ElementRef;
  @ViewChild('kubeDash', { read: ElementRef, static: false }) set kubeDash(kubeDash: ElementRef) {
    if (!this.pKubeDash) {
      this.pKubeDash = kubeDash;
      // Need to look at this process again. In tests this is never hit, leading to null references to kubeDash
      this.setupEventListener();
    }
  }
  get kubeDash(): ElementRef {
    return this.pKubeDash;
  }

  source: SafeResourceUrl;
  href = '';
  isLoading$ = new BehaviorSubject<boolean>(true);
  hasError$ = new BehaviorSubject<boolean>(false);
  expanded = true;

  private loadCheckTries = 0;
  private haveSetupEventLister = false;
  private hasIframeLoaded = false;
  public breadcrumbs$: Observable<IHeaderBreadcrumb[]>;

  public errorMsg$ = new BehaviorSubject<EndpointMissingMessageParts>({} as EndpointMissingMessageParts);

  constructor(public kubeEndpointService: KubernetesEndpointService, private sanitizer: DomSanitizer, public renderer: Renderer2) {
    this.hasError$.next(false);
  }

  ngOnInit() {
    const guid = this.kubeEndpointService.baseKube.guid;
    let href = window.location.href;
    const index = href.indexOf('dashboard');
    href = href.substr(index + 9);
    this.href = href;
    this.source = this.sanitizer.bypassSecurityTrustResourceUrl(`/pp/v1/kubedash/${guid}/login`);
    this.breadcrumbs$ = this.kubeEndpointService.endpoint$.pipe(
      map(endpoint => ([{
        breadcrumbs: [
          { value: endpoint.entity.name, routerLink: `/kubernetes/${endpoint.entity.guid}` },
        ]
      }])
      )
    );
  }

  public configUrl(): string {
    const guid = this.kubeEndpointService.baseKube.guid;
    return `/kubernetes/${guid}/dashboard-config`;
  }

  iframeLoaded() {
    if (!this.pKubeDash) {
      return;
    }
    this.loadCheckTries = 20;
    this.checkPageLoad();
    this.hasIframeLoaded = true;
    this.setupEventListener();
  }

  checkPageLoad() {
    let hasLoaded = false;
    const errMsg = this.getStratosError();
    if (!!errMsg) {
      hasLoaded = true;
      this.errorMsg$.next({
        firstLine: errMsg,
        secondLine: { text: '' }
      });
      this.hasError$.next(true);
    }

    const kdToolbar = this.getKubeDashToolbar();
    if (!!kdToolbar) {
      hasLoaded = true;
    }
    if (this.getKubeDashLogin()) {
      hasLoaded = true;
    }

    if (!hasLoaded) {
      this.loadCheckTries--;
      if (this.loadCheckTries > 0) {
        setTimeout(() => this.checkPageLoad(), 350);
      } else {
        hasLoaded = true;
      }
    }

    if (hasLoaded) {
      this.isLoading$.next(false);
      this.toggle(true);
    }

  }

  setupEventListener() {
    if (this.haveSetupEventLister || !this.pKubeDash || !this.hasIframeLoaded) {
      return;
    }

    this.haveSetupEventLister = true;
    const iframeWindow = this.pKubeDash.nativeElement.contentWindow;
    iframeWindow.addEventListener('hashchange', () => {
      if (this.href) {
        let h2 = decodeURI(this.href);
        h2 = decodeURI(h2);

        h2 = h2.replace('%3F', '?');
        h2 = h2.replace('%3D', '=');
        h2 = '#!' + h2;
        iframeWindow.location.hash = h2;
        this.href = '';
      }
    });
  }

  // toggle visibility of the kube dashboard header bar
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

  // Can we detect the dashboard's toolbar (implies dashboard UI has loaded)
  private getKubeDashToolbar() {
    if (this.pKubeDash &&
      this.pKubeDash.nativeElement &&
      this.pKubeDash.nativeElement.contentDocument &&
      this.pKubeDash.nativeElement.contentDocument.getElementsByTagName) {
      const kdChrome = this.pKubeDash.nativeElement.contentDocument.getElementsByTagName('kd-chrome')[0];
      if (kdChrome) {
        const kdToolbar = kdChrome.getElementsByTagName('mat-toolbar')[0];
        if (kdToolbar) {
          return kdToolbar;
        }
        const mdToolbar = kdChrome.getElementsByTagName('md-toolbar')[0];
        return mdToolbar;
      }
    }
    return null;
  }

  // Can we detect the dashboard login page?
  private getKubeDashLogin(): boolean {
    if (this.pKubeDash &&
      this.pKubeDash.nativeElement &&
      this.pKubeDash.nativeElement.contentDocument &&
      this.pKubeDash.nativeElement.contentDocument.getElementsByTagName) {
      const kdLogin = this.pKubeDash.nativeElement.contentDocument.getElementsByTagName('kd-login');
      return kdLogin.length === 1;
    }
    return false;
  }

  // Can we detect a Stratos error message page?
  private getStratosError(): string {
    if (this.pKubeDash &&
      this.pKubeDash.nativeElement &&
      this.pKubeDash.nativeElement.contentDocument &&
      this.pKubeDash.nativeElement.contentDocument.getElementsByTagName) {
      const stratosError = this.pKubeDash.nativeElement.contentDocument.getElementsByTagName('stratos-error');
      if (stratosError.length === 1) {
        return stratosError[0].innerText;
      }
    }
    return null;
  }
}
