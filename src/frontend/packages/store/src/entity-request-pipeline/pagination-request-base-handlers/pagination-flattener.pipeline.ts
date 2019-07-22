import { PaginatedAction } from '../../types/pagination.types';
import { PaginationFlattener, flattenPagination, BaseHttpClientFetcher, PaginationFlattenerConfig } from '../../helpers/paginated-request-helpers';
import { StratosBaseCatalogueEntity } from '../../../../core/src/core/entity-catalogue/entity-catalogue-entity';
import { entityCatalogue } from '../../../../core/src/core/entity-catalogue/entity-catalogue.service';
import { ActionDispatcher } from '../entity-request-pipeline.types';
import { Observable } from 'rxjs';
import { HttpClient, HttpRequest } from '@angular/common/http';

// export class BasePaginationFlattener extends BaseHttpClientFetcher<any> implements PaginationFlattener {
//   getTotalPages: (res: any) => number;
//   getTotalResults: (res: any) => number;
//   mergePages: (res: any[]) => any;
//   clearResults: (res: any, allResults: number) => Observable<any>;
//   constructor(
//     httpClient: HttpClient,
//     request: HttpRequest<any>,
//     config: PaginationFlattenerConfig
//   ) {
//     super(httpClient, request.url, request, 'page');
//     // THis might cause issues with this
//     this.getTotalPages = config.getTotalPages.bind(config);
//     this.getTotalResults = config.getTotalResults.bind(config);
//     this.mergePages = config.mergePages.bind(config);
//     this.clearResults = config.clearResults.bind(config);
//   }
// }

// export function flattenPaginationPipelineFactory(
//   actionDispatcher: ActionDispatcher,
//   action: PaginatedAction,
//   paginationFlattener: PaginationFlattener,
//   catalogueEntity: StratosBaseCatalogueEntity
// ) {
//   return (initialRequest: Observable<unknown>) => PaginationPageIterator(
//     actionDispatcher,
//     initialRequest,
//     action,
//     paginationFlattener,
//     catalogueEntity
//   );
// }

// export function flattenPaginationPipeline(
//   actionDispatcher: ActionDispatcher,
//   initialRequest: Observable<unknown>,
//   action: PaginatedAction,
//   paginationFlattener: PaginationFlattener,
//   catalogueEntity: StratosBaseCatalogueEntity
// ) {
//   const forcedEntityKey = action.__forcedPageEntityConfig__ ?
//     entityCatalogue.getEntityKey(action.__forcedPageEntityConfig__) :
//     null;
//   return flattenPagination(
//     actionDispatcher,
//     initialRequest,
//     paginationFlattener,
//     action.flattenPaginationMax,
//     catalogueEntity.entityKey,
//     action.paginationKey,
//     forcedEntityKey
//   );
// }