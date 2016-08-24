(function () {
  'use strict';

  describe('hce-support-service', function () {
    var $scope, $httpBackend, hceSupport;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      $scope = $injector.get('$rootScope').$new();
      $httpBackend = $injector.get('$httpBackend');
      hceSupport = $injector.get('cloud-foundry.view.applications.services.hceSupport');
    }));

    it('should be defined', function () {
      expect(hceSupport).toBeDefined();
      expect(hceSupport.getSupportedVcsInstances).toBeDefined();
    });

    it('should handle undefined', function () {
      hceSupport.getSupportedVcsInstances(undefined).then(function (supported) {
        expect(angular.isArray(supported)).toBe(true);
        expect(supported.length).toBe(0);
      });

      $scope.$apply();
    });

    it('should handle null', function () {
      hceSupport.getSupportedVcsInstances(null).then(function (supported) {
        expect(angular.isArray(supported)).toBe(true);
        expect(supported.length).toBe(0);
      });

      $scope.$apply();
    });

    it('should handle empty array', function () {
      hceSupport.getSupportedVcsInstances([]).then(function (supported) {
        expect(angular.isArray(supported)).toBe(true);
        expect(supported.length).toBe(0);
      });

      $scope.$apply();
    });

    describe('getSupportedVcsInstances with non-empty array', function () {
      beforeEach(function () {
        $httpBackend.when('GET', '/pp/v1/vcs/clients')
          .respond(200, ['https://github.com', 'https://my.github.enterprise']);
      });

      afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
      });

      it('should filter out unsupported VCS type - none supported', function () {
        var hceInstanceData = [
          {
            vcs_type: 'BITBUCKET',
            vcs_id: 'test_id_2',
            browse_url: 'bitbucket_url',
            label: 'BitBucket'
          }
        ];
        hceSupport.getSupportedVcsInstances(hceInstanceData)
          .then(function (supported) {
            expect(angular.isArray(supported)).toBe(true);
            expect(supported.length).toBe(0);
          });

        $httpBackend.flush();
      });

      it('should filter out unsupported VCS type - only one supported', function () {
        var hceInstanceData = [
          {
            vcs_type: 'BITBUCKET',
            vcs_id: 'test_id_2',
            browse_url: 'bitbucket_url',
            label: 'BitBucket'
          },
          {
            vcs_type: 'GITHUB',
            vcs_id: 'test_id_3',
            browse_url: 'https://github.com',
            label: 'GitHub'
          }
        ];
        hceSupport.getSupportedVcsInstances(hceInstanceData)
          .then(function (supported) {
            expect(angular.isArray(supported)).toBe(true);
            expect(supported.length).toBe(1);
            expect(supported[0].label).toBe('GitHub');
            expect(supported[0].value).toBeDefined();
            expect(supported[0].value.vcs_type).toBe('GITHUB');
            expect(supported[0].value.vcs_id).toBe('test_id_3');
            expect(supported[0].value.browse_url).toBe('https://github.com');
            expect(supported[0].browse_url).toBe('https://github.com');
          });

        $httpBackend.flush();
      });

      it('should filter out unsupported VCS type - github enterprise not supported', function () {
        var hceInstanceData = [
          {
            vcs_type: 'BITBUCKET',
            vcs_id: 'test_id_2',
            browse_url: 'bitbucket_url',
            label: 'BitBucket'
          },
          {
            vcs_type: 'GITHUB',
            vcs_id: 'test_id_3',
            browse_url: 'https://my.github.enterprise',
            label: 'GitHub Enterprise'
          }
        ];
        hceSupport.getSupportedVcsInstances(hceInstanceData)
          .then(function (supported) {
            expect(angular.isArray(supported)).toBe(true);
            expect(supported.length).toBe(1);
          });
        $httpBackend.flush();
      });
    });
  });
})();
