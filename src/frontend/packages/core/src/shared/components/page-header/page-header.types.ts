import { InternalEventSeverity } from '@stratosui/store';

export interface IHeaderBreadcrumbLink {
  value: string;
  routerLink?: string;
}

export interface IHeaderBreadcrumb {
  key?: string;
  breadcrumbs: IHeaderBreadcrumbLink[];
}

export const BREADCRUMB_URL_PARAM = 'breadcrumbs';

export interface PageHeaderNotice {
  message: string;
  serverity: InternalEventSeverity;
}
