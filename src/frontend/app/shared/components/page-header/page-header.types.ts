export interface IHeaderBreadcrumbLink {
  value: string;
  routerLink: string;
}

export interface IHeaderBreadcrumb {
  key?: string;
  breadcrumbs: IHeaderBreadcrumbLink[];
}
