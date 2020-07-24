import { getActions } from '../../../../../store/src/actions/action.helper';
import { PaginatedAction } from '../../../../../store/src/types/pagination.types';
import { analysisReportEntityType, KUBERNETES_ENDPOINT_TYPE, kubernetesEntityFactory } from '../kubernetes-entity-factory';
import { KubeAction, KubePaginationAction, KubeSingleEntityAction } from './kubernetes.actions';

export const GET_ANALYSIS_REPORTS_TYPES = getActions('ANALYSIS', 'Get reports');
export const GET_ANALYSIS_REPORT_BY_ID_TYPES = getActions('ANALYSIS', 'Get report by id');
export const GET_ANALYSIS_REPORTS_BY_PATH_TYPES = getActions('ANALYSIS', 'Get report by path');
export const DELETE_ANALYSIS_REPORT_TYPES = getActions('ANALYSIS', 'Delete report');
export const RUN_ANALYSIS_REPORT_TYPES = getActions('ANALYSIS', 'Run');

abstract class AnalysisAction implements KubeAction {
  constructor(public kubeGuid: string, public actions: string[]) {
    this.type = this.actions[0];
  }
  endpointType = KUBERNETES_ENDPOINT_TYPE;
  entityType = analysisReportEntityType;
  entity = [kubernetesEntityFactory(analysisReportEntityType)];
  type: string;
}
abstract class AnalysisPaginationAction extends AnalysisAction implements KubePaginationAction, PaginatedAction {
  flattenPagination = true;
  constructor(kubeGuid: string, actionTypes: string[], public paginationKey: string) {
    super(kubeGuid, actionTypes);
  }
}
abstract class AnalysisSingleEntityAction extends AnalysisAction implements KubeSingleEntityAction {
  constructor(kubeGuid: string, actionTypes: string[], public guid: string) {
    super(kubeGuid, actionTypes);
  }
}


/** 
 * Get the analysis reports for the given endpoint ID
 */
export class GetAnalysisReports extends AnalysisPaginationAction {
  constructor(public kubeGuid: string) {
    super(kubeGuid, GET_ANALYSIS_REPORTS_TYPES, kubeGuid)
  }
  initialParams = {
    'order-direction': 'asc',
    'order-direction-field': 'age',
  };
}

export class GetAnalysisReportById extends AnalysisSingleEntityAction {
  constructor(kubeGuid: string, id: string) {
    super(kubeGuid, GET_ANALYSIS_REPORT_BY_ID_TYPES, id);
  }
}

export class GetAnalysisReportsByPath extends AnalysisPaginationAction {
  constructor(kubeGuid: string, public path: string) {
    super(kubeGuid, GET_ANALYSIS_REPORTS_BY_PATH_TYPES, path);
  }
}

export class DeleteAnalysisReport extends AnalysisSingleEntityAction {
  constructor(kubeGuid: string, id: string) {
    super(kubeGuid, DELETE_ANALYSIS_REPORT_TYPES, id);
  }
}

export class RunAnalysisReport extends AnalysisSingleEntityAction {
  constructor(kubeGuid: string, id: string, public namespace?: string, public app?: string) {
    super(kubeGuid, RUN_ANALYSIS_REPORT_TYPES, id);
  }
}