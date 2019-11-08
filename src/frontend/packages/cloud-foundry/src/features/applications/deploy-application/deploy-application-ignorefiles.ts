/**
 * This is a typescript port of:
 *
 * https://github.com/codemix/gitignore-parser
 *
 * This parses and applies .gitignore style file/dir filters
 */
export class GitIgnoreFilter {

  private positives;
  private negatives;

  constructor(content: string) {
    const parsed = this.parse(content);
    this.positives = parsed[0];
    this.negatives = parsed[1];
  }

  accepts(input) {
    if (input[0] === '/') {
      input = input.slice(1);
    }
    return this.negatives[0].test(input) || !this.positives[0].test(input);
  }

  denies(input) {
    if (input[0] === '/') {
      input = input.slice(1);
    }
    return !(this.negatives[0].test(input) || !this.positives[0].test(input));
  }
  maybe(input) {
    if (input[0] === '/') {
      input = input.slice(1);
    }
    return this.negatives[1].test(input) || !this.positives[1].test(input);
  }

  /**
   * Parse the given `.gitignore` content and return an array
   * containing two further arrays - positives and negatives.
   * Each of these two arrays in turn contains two regexps, one
   * strict and one for 'maybe'.
   *
   * @param  content  The content to parse,
   * @returns          The parsed positive and negatives definitions.
   */
  parse(content) {
    const prepareRegexes = this.prepareRegexes.bind(this);
    return content.split('\n')
      .map(line => {
        line = line.trim();
        return line;
      })
      .filter(line => {
        return line && line[0] !== '#';
      })
      .reduce((lists, line) => {
        const isNegative = line[0] === '!';
        if (isNegative) {
          line = line.slice(1);
        }
        if (line[0] === '/') {
          line = line.slice(1);
        }
        if (isNegative) {
          lists[1].push(line);
        } else {
          lists[0].push(line);
        }
        return lists;
      }, [[], []])
      .map((list) => {
        return list
          .sort()
          .map(pattern => prepareRegexes(pattern))
          .reduce((ls, prepared) => {
            ls[0].push(prepared[0]);
            ls[1].push(prepared[1]);
            return ls;
          }, [[], [], []]);
      })
      .map(item => {
        return [
          item[0].length > 0 ? new RegExp('^((' + item[0].join(')|(') + '))') : new RegExp('$^'),
          item[1].length > 0 ? new RegExp('^((' + item[1].join(')|(') + '))') : new RegExp('$^')
        ];
      });
  }

  prepareRegexes(pattern) {
    return [
      // exact regex
      this.prepareRegexPattern(pattern),
      // partial regex
      this.preparePartialRegex(pattern)
    ];
  }

  prepareRegexPattern(pattern) {
    return this.escapeRegex(pattern).replace('**', '(.+)').replace('*', '([^\\/]+)');
  }

  preparePartialRegex(pattern) {
    const prepareRegexPattern = this.prepareRegexPattern.bind(this);
    return pattern
      .split('/')
      .map((item, index) => {
        if (index) {
          return '([\\/]?(' + prepareRegexPattern(item) + '\\b|$))';
        } else {
          return '(' + prepareRegexPattern(item) + '\\b)';
        }
      })
      .join('');
  }

  private escapeRegex(pattern) {
    return pattern.replace(/[\-\[\]\/\{\}\(\)\+\?\.\\\^\$\|]/g, '\\$&');
  }

}
