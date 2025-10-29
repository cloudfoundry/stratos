import moment from 'moment';

import { UtilsService } from '../../../../../../core/src/core/utils.service';
import { AnsiColorizer } from '../../../../../../core/src/shared/components/log-viewer/ansi-colorizer';
import { FireHoseItem, HTTP_METHODS } from './cloud-foundry-firehose.types';

/**
 * Formats log messages from the Cloud Foundry firehose
 */

/* eslint-disable no-control-regex */
const ANSI_ESCAPE_MATCHER = new RegExp('\x1B\\[([0-9;]*)m', 'g');
/* eslint-enable no-control-regex */

// Format the messages from the Cloud Foundry firehose
export class CloudFoundryFirehoseFormatter {

  // Current filters
  public hoseFilters = {
    api: true,
    apps: true,
    metrics: true,
    counters: true,
    errors: true,
    containerMetrics: true,
    others: true
  };

  private colorizer = new AnsiColorizer();

  constructor(private utils: UtilsService) { }

  // Enable or disable all filters
  public showAll(all: boolean) {
    Object.keys(this.hoseFilters).forEach((filter: keyof typeof this.hoseFilters) => this.hoseFilters[filter] = all);
  }

  /**
   * Filter and format Firehose JSOM log message
   */
  public jsonFilter(jsonString: string): string {
    let filtered = jsonString;
    try {
      const cfEvent: FireHoseItem = JSON.parse(jsonString);
      switch (cfEvent.eventType) {
        case 4:
          filtered = this.handleApiEvent(cfEvent);
          break;
        case 5:
          filtered = this.handleAppLog(cfEvent);
          break;
        case 6:
          filtered = this.handleMetricEvent(cfEvent);
          break;
        case 7:
          filtered = this.handleCounterEvent(cfEvent);
          break;
        case 8:
          filtered = this.handleErrorEvent(cfEvent);
          break;
        case 9:
          filtered = this.handleContainerMetricsEvent(cfEvent);
          break;
        default:
          filtered = this.handleOtherEvent(jsonString);
      }
    } catch (error) {
      console.error('Failed to filter jsonMessage from WebSocket: ' + jsonString);
      filtered = jsonString;
    }

    return filtered;
  }

  private buildOriginString(cfEvent: FireHoseItem, colour: string, bold?: boolean) {
    return this.buildTimestampString(cfEvent) + ': ' +
      this.colorizer.colorize('[' + cfEvent.deployment + '/' + cfEvent.origin + '/' + cfEvent.job + ']', colour, bold);
  }

  private buildTimestampString(cfEvent: FireHoseItem) {
    // CF time stamps are in nanoseconds
    const msStamp = Math.round(cfEvent.timestamp / 1000000);
    return moment(msStamp).format('HH:mm:ss.SSS');
  }

  private emphasizeName(dottedString: string, colour: string): string {
    let metricName = dottedString;
    const lastDot = metricName.lastIndexOf('.');
    if (lastDot > -1) {
      // Weird bug where sometimes the name ends with a dot
      if (lastDot === dottedString.length - 1) {
        return this.colorizer.colorize(metricName.slice(0, -1), colour, true);
      }
      const prefix = metricName.slice(0, lastDot + 1);
      const name = metricName.slice(lastDot + 1);
      metricName = prefix + this.colorizer.colorize(name, colour, true);
    } else {
      metricName = this.colorizer.colorize(metricName, colour, true);
    }
    return metricName;
  }

  private handleApiEvent(cfEvent: FireHoseItem): string {
    if (!this.hoseFilters.api) {
      return '';
    }
    const httpStartStop = cfEvent.httpStartStop;
    const method = HTTP_METHODS[httpStartStop.method - 1];
    const peerType = httpStartStop.peerType === 1 ? 'Client' : 'Server';
    const httpEventString = peerType + ' ' + this.colorizer.colorize(method, 'magenta', true) + ' ' +
      this.colorizer.colorize(httpStartStop.uri, null, true) +
      ', Status-Code: ' + this.colorizer.colorize(httpStartStop.statusCode.toString(), 'green') +
      ', Content-Length: ' + this.colorizer.colorize(this.utils.bytesToHumanSize(httpStartStop.contentLength.toString()), 'green') +
      ', User-Agent: ' + this.colorizer.colorize(httpStartStop.userAgent, 'green') +
      ', Remote-Address: ' + this.colorizer.colorize(httpStartStop.remoteAddress, 'green') + '\n';
    return this.buildOriginString(cfEvent, 'magenta') + ' ' + httpEventString;
  }

  handleAppLog(cfEvent: FireHoseItem): string {
    if (!this.hoseFilters.apps) {
      return '';
    }
    const message = cfEvent.logMessage;
    let colour;
    if (message.message_type === 2) {
      colour = 'red';
    }
    const messageSource = this.colorizer.colorize('[' + message.source_type + '.' + message.source_instance + ']', 'green', true);
    const messageString = this.colorizer.colorize(atob(message.message), colour, false) + '\n';
    return this.buildOriginString(cfEvent, 'green') + ' ' + messageSource + ' ' + messageString;
  }

  handleMetricEvent(cfEvent: FireHoseItem): string {
    if (!this.hoseFilters.metrics) {
      return '';
    }
    const valueMetric = cfEvent.valueMetric;
    const valueMetricString = this.emphasizeName(valueMetric.name, 'blue') + ': ' +
      this.colorizer.colorize(valueMetric.value + ' ' + valueMetric.unit, 'green', true) + '\n';
    return this.buildOriginString(cfEvent, 'blue') + ' ' + valueMetricString;
  }

  handleCounterEvent(cfEvent: FireHoseItem): string {
    if (!this.hoseFilters.counters) {
      return '';
    }
    const counterEvent = cfEvent.counterEvent;
    const delta: string = counterEvent.name.indexOf('ByteCount') !== -1
      ? this.utils.bytesToHumanSize(counterEvent.delta.toString())
      : counterEvent.delta.toString();
    const total: string = counterEvent.name.indexOf('ByteCount') !== -1
      ? this.utils.bytesToHumanSize(counterEvent.total.toString())
      : counterEvent.total.toString();

    const counterEventString = this.emphasizeName(counterEvent.name, 'yellow') +
      ': delta = ' + this.colorizer.colorize(delta, 'green', true) +
      ', total = ' + this.colorizer.colorize(total, 'green', true) + '\n';
    return this.buildOriginString(cfEvent, 'yellow') + ' ' + counterEventString;
  }

  handleContainerMetricsEvent(cfEvent: FireHoseItem): string {
    if (!this.hoseFilters.containerMetrics) {
      return '';
    }
    const containerMetric = cfEvent.containerMetric;
    const metricString = 'App: ' + containerMetric.applicationId + '/' + containerMetric.instanceIndex +
      ' ' + this.colorizer.colorize('[', 'cyan', true) + this.colorizer.colorize('CPU: ', 'cyan', true) +
      this.colorizer.colorize(Math.round(containerMetric.cpuPercentage * 100) + '%', 'green', true) +
      ', ' + this.colorizer.colorize('Memory: ', 'cyan', true) +
      this.colorizer.colorize(this.utils.bytesToHumanSize(containerMetric.memoryBytes.toString()), 'green', true) +
      ', ' + this.colorizer.colorize('Disk: ', 'cyan', true) +
      this.colorizer.colorize(this.utils.bytesToHumanSize(containerMetric.diskBytes.toString()), 'green', true) +
      this.colorizer.colorize(']', 'cyan', true);
    return this.buildOriginString(cfEvent, 'cyan') + ' ' + metricString + '\n';
  }

  handleErrorEvent(cfEvent: FireHoseItem): string {
    if (!this.hoseFilters.errors) {
      return '';
    }
    const errorObj = cfEvent.error;
    const errorString = 'ERROR: Source: ' + this.colorizer.colorize(errorObj.source, 'red', true) +
      ', Code: ' + this.colorizer.colorize(errorObj.code.toString(), 'red', true) +
      ', Message: ' + this.colorizer.colorize(errorObj.message, 'red', true);
    return this.buildOriginString(cfEvent, 'red', true) + ' ' + errorString + '\n';
  }

  handleOtherEvent(jsonString: string): string {
    if (!this.hoseFilters.others) {
      return '';
    }
    return jsonString;
  }

  // Map each character index in the sanitized version of originalString to its original index in originalString
  mapSanitizedIndices(originalString: string): Record<number, number> {
    let escapeMatch = ANSI_ESCAPE_MATCHER.exec(originalString);
    const mappedIndices: Record<number, number> = {};
    let mappedUpTo = 0;
    let offset = 0;

    ANSI_ESCAPE_MATCHER.lastIndex = 0;
    while (escapeMatch !== null) {
      while (mappedUpTo + offset < escapeMatch.index) {
        mappedIndices[mappedUpTo] = offset + mappedUpTo++;
      }
      offset += escapeMatch[0].length;
      escapeMatch = ANSI_ESCAPE_MATCHER.exec(originalString);
    }
    while (mappedUpTo + offset < originalString.length) {
      mappedIndices[mappedUpTo] = offset + mappedUpTo++;
    }
    return mappedIndices;
  }

  // Determine which colour and bold modes are active where the highlight ends
  getPreviousModes(toEndOfMatch: string): { bold: boolean | null; colour: string | null } {
    let escapeMatch = ANSI_ESCAPE_MATCHER.exec(toEndOfMatch);
    let boldOn = null;
    let prevColour = null;
    let lastColourMatches = null;

    ANSI_ESCAPE_MATCHER.lastIndex = 0;
    while (escapeMatch !== null) {
      lastColourMatches = escapeMatch;
      escapeMatch = ANSI_ESCAPE_MATCHER.exec(toEndOfMatch);
    }
    if (lastColourMatches !== null) {
      boldOn = lastColourMatches[1].indexOf('1') === 0;
      if (lastColourMatches[1] === '1') {
        prevColour = null;
      } else {
        if (boldOn) {
          prevColour = lastColourMatches[1][3];
        } else {
          prevColour = lastColourMatches[1][1];
        }
      }
    }

    return {
      bold: boldOn,
      colour: prevColour
    };
  }
}
