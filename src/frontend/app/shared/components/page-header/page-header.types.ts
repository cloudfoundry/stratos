import { InternalEventSeverity } from '../../../store/types/internal-events.types';

export interface PageHeaderNotice {
  message: string;
  serverity: InternalEventSeverity;
}
