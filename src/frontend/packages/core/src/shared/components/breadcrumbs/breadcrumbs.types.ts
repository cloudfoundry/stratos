export interface IBreadcrumbLink {
  value: string;
  routerLink?: string;
}

export interface IBreadcrumb {
  key?: string;
  breadcrumbs: IBreadcrumbLink[];
}

export const BREADCRUMB_URL_PARAM = 'breadcrumbs';
