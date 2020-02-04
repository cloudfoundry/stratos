import { ValidatorFn } from '@angular/forms';
import * as moment from 'moment';


export function formatCPUTime(value: string | number, debug = false): string {

  const cpuTimeFormat = {
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1
  };
  const cpuTimeFormatOrder = ['day', 'hour', 'minute', 'second'];

  let num = (typeof value === 'number') ? value : parseFloat(replaceAll(value, ',', ''));
  if (isNaN(num)) {
    return '-';
  }

  // Duration is in seconds
  const result = [];
  cpuTimeFormatOrder.forEach(key => {
    const v = Math.floor(num / cpuTimeFormat[key]);
    num -= v * cpuTimeFormat[key];
    if (v > 0 || result.length > 0) {
      result.push(v + key.substr(0, 1));
    }
  });

  if (result.length === 0) {
    result.push('0s');
  }

  return result.join(' ');
}

function replaceAll(str, find, replace) {
  return str.replace(new RegExp(find, 'g'), replace);
}

export function formatAxisCPUTime(value: string) {
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
