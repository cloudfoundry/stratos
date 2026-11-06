import { intervalToDuration } from 'date-fns';


export function formatCPUTime(value: string | number, _debug = false): string {

  const cpuTimeFormat: Record<string, number> = {
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
  const result: string[] = [];
  cpuTimeFormatOrder.forEach((key: string) => {
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

function replaceAll(str: string, find: string, replace: string): string {
  return str.replace(new RegExp(find, 'g'), replace);
}

export function formatAxisCPUTime(value: string) {
  const milliseconds = parseFloat(value) * 1000;
  const duration = intervalToDuration({ start: 0, end: milliseconds });

  const days = (duration.years || 0) * 365 + (duration.months || 0) * 30 + (duration.days || 0);
  const hours = (duration.hours || 0);
  const minutes = (duration.minutes || 0);
  const seconds = (duration.seconds || 0);

  const totalDays = days + hours / 24 + minutes / 1440 + seconds / 86400;
  const totalHours = days * 24 + hours + minutes / 60 + seconds / 3600;
  const totalMinutes = totalHours * 60;
  const totalSeconds = milliseconds / 1000;

  if (totalDays >= 1) {
    return `${totalDays.toPrecision(2)} d`;
  }
  if (totalHours >= 1) {
    return `${totalHours.toPrecision(2)} hrs`;
  }
  if (totalMinutes >= 1) {
    return `${totalMinutes.toPrecision(2)} min`;
  }
  if (totalSeconds >= 1) {
    return `${totalSeconds.toPrecision(2)} sec`;
  }
  if (milliseconds >= 1) {
    return `${totalSeconds.toPrecision(2)} msec`;
  }
  return value;
}
