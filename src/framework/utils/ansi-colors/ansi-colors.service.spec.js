/* eslint-disable eqeqeq */
(function () {
  'use strict';

  describe('Ansi Colors Service', function () {
    var service;

    beforeEach(module('templates'));
    beforeEach(module('helion.framework'));

    beforeEach(inject(function ($injector) {
      service = $injector.get('AnsiColorsService');
    }));

    it('should be defined', function () {
      expect(service).toBeDefined();
    });

    it('get instance should be defined', function () {
      expect(service.getInstance()).toBeDefined();
    });

    it('all combinations', allCombinations);

    it('no-op', function () {
      test('this is input without colour', 'this is input without colour');
    });
    it('multiple modes', function () {
      test('\x1B[31;42;1;0;37;1;41mShould be intense white on red\x1B[0m',
        '<span class="intense ansi-white ansi-background-red">Should be intense white on red</span>');
    });
    it('Test empty as reset', function () {
      test('\x1B[37;1;42mShould be intense white on green\x1B[m',
        '<span class="intense ansi-white ansi-background-green">Should be intense white on green</span>');
    });
    it('Test linefeeds', function () {
      test('\x1B[37;1;42mBefore linefeeds\x1B[m\n\n\n\x1B[37;1;42mShould be intense white on green\x1B[0m',
        '<span class="intense ansi-white ansi-background-green">' +
        'Before linefeeds\n\n\nShould be intense white on green</span>');
    });

    function allCombinations() {
      var input = [];
      for (var bg = 40; bg <= 47; bg++) {
        for (var bold = 0; bold <= 1; bold++) {
          var line = '';
          line += '\x1B[0m ESC[' + bg + 'm   | ';
          for (var fg = 30; fg <= 37; fg++) {
            if (bold == '0') {
              line += '\x1B[' + bg + 'm\x1B[' + fg + 'm [' + fg + 'm  ';
            } else {
              line += '\x1B[' + bg + 'm\x1B[1;' + fg + 'm [1;' + fg + 'm';
            }
          }
          line += '\x1B[0m';
          input.push(line);
        }
      }

      var expected = [];
      expected.push(' ESC[40m   | <span class="ansi-black ansi-background-black"> [30m  </span><span ' +
        'class="ansi-red ansi-background-black"> [31m  </span><span class="ansi-green ansi-background-black"> ' +
        '[32m  </span><span class="ansi-yellow ansi-background-black"> [33m  </span><span class="ansi-blue ' +
        'ansi-background-black"> [34m  </span><span class="ansi-magenta ansi-background-black"> [35m  ' +
        '</span><span class="ansi-cyan ansi-background-black"> [36m  </span><span class="ansi-white ' +
        'ansi-background-black"> [37m  </span>');
      expected.push(' ESC[40m   | <span class="intense ansi-black ansi-background-black"> [1;30m</span><span ' +
        'class="intense ansi-red ansi-background-black"> [1;31m</span><span class="intense ansi-green ' +
        'ansi-background-black"> [1;32m</span><span class="intense ansi-yellow ansi-background-black"> ' +
        '[1;33m</span><span class="intense ansi-blue ansi-background-black"> [1;34m</span><span ' +
        'class="intense ansi-magenta ansi-background-black"> [1;35m</span><span class="intense ansi-cyan ' +
        'ansi-background-black"> [1;36m</span><span class="intense ansi-white ansi-background-black"> ' +
        '[1;37m</span>');
      expected.push(' ESC[41m   | <span class="ansi-black ansi-background-red"> [30m  </span><span class="ansi-red ' +
        'ansi-background-red"> [31m  </span><span class="ansi-green ansi-background-red"> [32m  </span><span ' +
        'class="ansi-yellow ansi-background-red"> [33m  </span><span class="ansi-blue ansi-background-red"> ' +
        '[34m  </span><span class="ansi-magenta ansi-background-red"> [35m  </span><span class="ansi-cyan ' +
        'ansi-background-red"> [36m  </span><span class="ansi-white ansi-background-red"> [37m  </span>');
      expected.push(' ESC[41m   | <span class="intense ansi-black ansi-background-red"> [1;30m</span><span ' +
        'class="intense ansi-red ansi-background-red"> [1;31m</span><span class="intense ansi-green ' +
        'ansi-background-red"> [1;32m</span><span class="intense ansi-yellow ansi-background-red"> ' +
        '[1;33m</span><span class="intense ansi-blue ansi-background-red"> [1;34m</span><span ' +
        'class="intense ansi-magenta ansi-background-red"> [1;35m</span><span class="intense ansi-cyan' +
        ' ansi-background-red"> [1;36m</span><span class="intense ansi-white ansi-background-red"> [1;37m</span>');
      expected.push(' ESC[42m   | <span class="ansi-black ansi-background-green"> [30m  </span><span ' +
        'class="ansi-red ansi-background-green"> [31m  </span><span class="ansi-green ansi-background-green"> ' +
        '[32m  </span><span class="ansi-yellow ansi-background-green"> [33m  </span><span class="ansi-blue ' +
        'ansi-background-green"> [34m  </span><span class="ansi-magenta ansi-background-green"> [35m  </span>' +
        '<span class="ansi-cyan ansi-background-green"> [36m  </span><span class="ansi-white ' +
        'ansi-background-green"> [37m  </span>');
      expected.push(' ESC[42m   | <span class="intense ansi-black ansi-background-green"> [1;30m</span><span ' +
        'class="intense ansi-red ansi-background-green"> [1;31m</span><span class="intense ansi-green ' +
        'ansi-background-green"> [1;32m</span><span class="intense ansi-yellow ansi-background-green"> ' +
        '[1;33m</span><span class="intense ansi-blue ansi-background-green"> [1;34m</span><span ' +
        'class="intense ansi-magenta ansi-background-green"> [1;35m</span><span class="intense ansi-cyan ' +
        'ansi-background-green"> [1;36m</span><span class="intense ansi-white ansi-background-green"> ' +
        '[1;37m</span>');
      expected.push(' ESC[43m   | <span class="ansi-black ansi-background-yellow"> [30m  </span><span ' +
        'class="ansi-red ansi-background-yellow"> [31m  </span><span class="ansi-green ansi-background-yellow"> ' +
        '[32m  </span><span class="ansi-yellow ansi-background-yellow"> [33m  </span><span class="ansi-blue ' +
        'ansi-background-yellow"> [34m  </span><span class="ansi-magenta ansi-background-yellow"> [35m  </span>' +
        '<span class="ansi-cyan ansi-background-yellow"> [36m  </span><span class="ansi-white ' +
        'ansi-background-yellow"> [37m  </span>');
      expected.push(' ESC[43m   | <span class="intense ansi-black ansi-background-yellow"> [1;30m</span><span ' +
        'class="intense ansi-red ansi-background-yellow"> [1;31m</span><span class="intense ansi-green ' +
        'ansi-background-yellow"> [1;32m</span><span class="intense ansi-yellow ansi-background-yellow"> ' +
        '[1;33m</span><span class="intense ansi-blue ansi-background-yellow"> [1;34m</span><span class="intense ' +
        'ansi-magenta ansi-background-yellow"> [1;35m</span><span class="intense ansi-cyan ' +
        'ansi-background-yellow"> [1;36m</span><span class="intense ansi-white ansi-background-yellow"> [1;37m' +
        '</span>');
      expected.push(' ESC[44m   | <span class="ansi-black ansi-background-blue"> [30m  </span><span ' +
        'class="ansi-red ansi-background-blue"> [31m  </span><span class="ansi-green ansi-background-blue"> ' +
        '[32m  </span><span class="ansi-yellow ansi-background-blue"> [33m  </span><span class="ansi-blue ' +
        'ansi-background-blue"> [34m  </span><span class="ansi-magenta ansi-background-blue"> [35m  </span>' +
        '<span class="ansi-cyan ansi-background-blue"> [36m  </span><span class="ansi-white ' +
        'ansi-background-blue"> [37m  </span>');
      expected.push(' ESC[44m   | <span class="intense ansi-black ansi-background-blue"> [1;30m</span><span ' +
        'class="intense ansi-red ansi-background-blue"> [1;31m</span><span class="intense ansi-green ' +
        'ansi-background-blue"> [1;32m</span><span class="intense ansi-yellow ansi-background-blue"> [1;33m' +
        '</span><span class="intense ansi-blue ansi-background-blue"> [1;34m</span><span class="intense ' +
        'ansi-magenta ansi-background-blue"> [1;35m</span><span class="intense ansi-cyan ansi-background-blue"> ' +
        '[1;36m</span><span class="intense ansi-white ansi-background-blue"> [1;37m</span>');
      expected.push(' ESC[45m   | <span class="ansi-black ansi-background-magenta"> [30m  </span><span class' +
        '="ansi-red ansi-background-magenta"> [31m  </span><span class="ansi-green ansi-background-magenta"> ' +
        '[32m  </span><span class="ansi-yellow ansi-background-magenta"> [33m  </span><span class="ansi-blue ' +
        'ansi-background-magenta"> [34m  </span><span class="ansi-magenta ansi-background-magenta"> [35m  </span>' +
        '<span class="ansi-cyan ansi-background-magenta"> [36m  </span><span class="ansi-white ' +
        'ansi-background-magenta"> [37m  </span>');
      expected.push(' ESC[45m   | <span class="intense ansi-black ansi-background-magenta"> [1;30m</span><span ' +
        'class="intense ansi-red ansi-background-magenta"> [1;31m</span><span class="intense ansi-green ' +
        'ansi-background-magenta"> [1;32m</span><span class="intense ansi-yellow ansi-background-magenta"> ' +
        '[1;33m</span><span class="intense ansi-blue ansi-background-magenta"> [1;34m</span><span class="intense ' +
        'ansi-magenta ansi-background-magenta"> [1;35m</span><span class="intense ansi-cyan ' +
        'ansi-background-magenta"> [1;36m</span><span class="intense ansi-white ansi-background-magenta"> ' +
        '[1;37m</span>');
      expected.push(' ESC[46m   | <span class="ansi-black ansi-background-cyan"> [30m  </span><span ' +
        'class="ansi-red ansi-background-cyan"> [31m  </span><span class="ansi-green ansi-background-cyan"> ' +
        '[32m  </span><span class="ansi-yellow ansi-background-cyan"> [33m  </span><span class="ansi-blue ' +
        'ansi-background-cyan"> [34m  </span><span class="ansi-magenta ansi-background-cyan"> [35m  </span>' +
        '<span class="ansi-cyan ansi-background-cyan"> [36m  </span><span class="ansi-white ' +
        'ansi-background-cyan"> [37m  </span>');
      expected.push(' ESC[46m   | <span class="intense ansi-black ansi-background-cyan"> [1;30m</span><span ' +
        'class="intense ansi-red ansi-background-cyan"> [1;31m</span><span class="intense ansi-green ' +
        'ansi-background-cyan"> [1;32m</span><span class="intense ansi-yellow ansi-background-cyan"> [1;33m' +
        '</span><span class="intense ansi-blue ansi-background-cyan"> [1;34m</span><span class="intense ' +
        'ansi-magenta ansi-background-cyan"> [1;35m</span><span class="intense ansi-cyan ansi-background-cyan">' +
        ' [1;36m</span><span class="intense ansi-white ansi-background-cyan"> [1;37m</span>');
      expected.push(' ESC[47m   | <span class="ansi-black ansi-background-white"> [30m  </span><span ' +
        'class="ansi-red ansi-background-white"> [31m  </span><span class="ansi-green ansi-background-white"> ' +
        '[32m  </span><span class="ansi-yellow ansi-background-white"> [33m  </span><span class="ansi-blue ' +
        'ansi-background-white"> [34m  </span><span class="ansi-magenta ansi-background-white"> [35m  </span>' +
        '<span class="ansi-cyan ansi-background-white"> [36m  </span><span class="ansi-white ' +
        'ansi-background-white"> [37m  </span>');
      expected.push(' ESC[47m   | <span class="intense ansi-black ansi-background-white"> [1;30m</span><span ' +
        'class="intense ansi-red ansi-background-white"> [1;31m</span><span class="intense ansi-green ' +
        'ansi-background-white"> [1;32m</span><span class="intense ansi-yellow ansi-background-white"> ' +
        '[1;33m</span><span class="intense ansi-blue ansi-background-white"> [1;34m</span><span class="intense ' +
        'ansi-magenta ansi-background-white"> [1;35m</span><span class="intense ansi-cyan ansi-background-white">' +
        ' [1;36m</span><span class="intense ansi-white ansi-background-white"> [1;37m</span>');

      expect(input.length).toEqual(expected.length);
      for (var i = 0; i < input.length; i++) {
        test(input[i], expected[i], 'failure at index: ' + i);
      }
    }

    function test(input, output, message) {
      expect(service.getInstance().ansiColorsToHtml(input)).toEqual(output, message);
    }
  });
})();
