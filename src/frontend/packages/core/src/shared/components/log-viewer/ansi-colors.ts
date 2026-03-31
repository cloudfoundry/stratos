/* eslint-disable no-control-regex */
const ansiEscapeMatcher = new RegExp('(?:\x1B\\[[0-9;]*m[\n]*)+', 'g');
const ansiEscapeExtractor = new RegExp('\x1B\\[([0-9;]*)m([\n]*)', 'g');
/* eslint-enable no-control-regex */

// Map of ANSI foreground color codes to color names
const fgAnsiToNames: Record<number, string> = {
  30: 'black',
  31: 'red',
  32: 'green',
  33: 'yellow',
  34: 'blue',
  35: 'magenta',
  36: 'cyan',
  37: 'white'
};

// Map of ANSI background color codes to color names
const bgAnsiToNames: Record<number, string> = {};
for (const ansiColor in fgAnsiToNames) {
  if (!Object.prototype.hasOwnProperty.call(fgAnsiToNames, ansiColor)) {
    continue;
  }
  const colorCode = parseInt(ansiColor, 10);
  bgAnsiToNames[colorCode + 10] = fgAnsiToNames[colorCode];
}

export class AnsiColors {

  spanOpen = false;
  currentFg: number | null = null;
  currentBg: number | null = null;
  boldOn = false;

  constructor() {}

  reset() {
    this.currentFg = null;
    this.currentBg = null;
    this.boldOn = false;
  }

  makeSpan() {
    let span = '';
    if (this.boldOn || this.currentFg || this.currentBg) {
      span += '<span class="';
      if (this.boldOn) {
        span += 'intense ';
      }
      if (this.currentFg) {
        span += 'ansi-';
        span += fgAnsiToNames[this.currentFg];
        span += ' ';
      }
      if (this.currentBg) {
        span += 'ansi-background-';
        span += bgAnsiToNames[this.currentBg];
      }
      span += '">';
    }

    let close = '';
    if (!!span !== this.spanOpen) {
      // Close previous span if required
      if (this.spanOpen) {
        close = '</span>';
      }
      this.spanOpen = !!span;
    } else {
      // $log.debug('Re-using identical open span!: ' + span);
      span = '';
    }

    return close + span;
  }

  smartReplacer(match: string): string {
    // First flatten all consecutive mode switches into a single string
    const modes = match.replace(ansiEscapeExtractor, this.ansiGroupParser.bind(this)).split(';');
    let lineFeeds = '';

    // Support n-modes switching like a real terminal
    for (let i = 0; i < modes.length - 1; i++) {
      const mode = parseInt(modes[i], 10);

      // Handle line feeds
      if (mode < 0) {
        for (let n = mode; n < 0; n++) {
          lineFeeds += '\n';
        }
        continue;
      }

      this.handleMode(mode);
    }
    // Return a single span with the correct classes for all consecutive SGR parameters
    return this.makeSpan() + lineFeeds;
  }

  handleMode(mode: number): void {
    switch (mode) {
      // Reset all
      case 0:
        this.reset();
        break;
      // Enable bold
      case 1:
        this.boldOn = true;
        break;
      // Disable bold
      case 22:
        this.boldOn = false;
        break;
      // Reset foreground
      case 39:
        this.currentFg = null;
        break;
      // Reset background
      case 49:
        this.currentBg = null;
        break;
      default:
        if (mode <= 37 && mode >= 30) {
          // Normal foreground color
          this.currentFg = mode;
        } else if (mode <= 47 && mode >= 40) {
          // Background color
          this.currentBg = mode;
        }
        break;
    }
  }

  ansiGroupParser(match: string, graphicModes: string, lineFeeds: string): string {
    let ret = '';
    if (lineFeeds) {
      ret += -lineFeeds.length + ';';
    }
    if (!graphicModes) {
      // An empty mode string means reset all
      return ret + '0;';
    }

    // Non empty modes processed as normal
    return ret + graphicModes + ';';
  }

  ansiColorsToHtml(str: string): string {
    // $log.debug('Calling replacer on String: ' + '\n---\n' + str + '\n---\n');
    if (!str.replace) {
      return str;
    }
    str = str.replace(/</g, '&lt;'); // Escape embedded markup
    return str.replace(ansiEscapeMatcher, this.smartReplacer.bind(this));
  }
}
