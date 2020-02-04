import * as moment from 'moment';

export function formatCPUTime(value: string) {
  const duration = moment.duration(parseFloat(value) * 1000);
  if (duration.asDays() >= 1) {
    return `${duration.asDays().toPrecision(2)} d`;
  }
  if (duration.asHours() >= 1) {
    return `${duration.asHours().toPrecision(2)} hrs`;
  }
  if (duration.asMinutes() >= 1) {
    return `${duration.asMinutes().toPrecision(2)} min`;
  }
  if (duration.asSeconds() >= 1) {
    return `${duration.asSeconds().toPrecision(2)} sec`;
  }
  if (duration.asMilliseconds() >= 1) {
    return `${duration.asSeconds().toPrecision(2)} msec`;
  }
  return value;
}
