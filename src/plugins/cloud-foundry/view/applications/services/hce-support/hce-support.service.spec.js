(function () {
  'use strict';

  describe('hce-support-service', function () {
    var hceSupport;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));

    beforeEach(inject(function ($injector) {
      hceSupport = $injector.get('cloud-foundry.view.applications.services.hceSupport');
    }));

    it('should be defined', function () {
      expect(hceSupport).toBeDefined();
      expect(hceSupport.getSupportedVcsInstances).toBeDefined();
    });

    it('should handle undefined', function () {
      expect(angular.isArray(hceSupport.getSupportedVcsInstances(undefined))).toBe(true);
      expect(hceSupport.getSupportedVcsInstances(undefined).length).toBe(0);
    });

    it('should handle null', function () {
      expect(angular.isArray(hceSupport.getSupportedVcsInstances(null))).toBe(true);
      expect(hceSupport.getSupportedVcsInstances(null).length).toBe(0);
    });

    it('should handle empty array', function () {
      expect(angular.isArray(hceSupport.getSupportedVcsInstances([]))).toBe(true);
      expect(hceSupport.getSupportedVcsInstances([]).length).toBe(0);
    });

    it('should filter out unsupported VCS type - none supported', function () {
      var hceInstanceData = [
        {
          vcs_type: 'BITBUCKET',
          vcs_id: 'test_id_2',
          browse_url: 'bitbucket_url'
        }
      ];
      var supported = hceSupport.getSupportedVcsInstances(hceInstanceData);
      expect(angular.isArray(supported)).toBe(true);
      expect(supported.length).toBe(0);
    });

    it('should filter out unsupported VCS type - only one supported', function () {
      var hceInstanceData = [
        {
          vcs_type: 'BITBUCKET',
          vcs_id: 'test_id_2',
          browse_url: 'bitbucket_url'
        },
        {
          vcs_type: 'GITHUB',
          vcs_id: 'test_id_3',
          browse_url: 'github_url'
        }
      ];
      var supported = hceSupport.getSupportedVcsInstances(hceInstanceData);
      expect(angular.isArray(supported)).toBe(true);
      expect(supported.length).toBe(1);
      expect(supported[0].label).toBe('GitHub');
      expect(supported[0].value).toBeDefined();
      expect(supported[0].value.vcs_type).toBe('GITHUB');
      expect(supported[0].value.vcs_id).toBe('test_id_3');
      expect(supported[0].value.browse_url).toBe('github_url');
      expect(supported[0].browse_url).toBe('github_url');
    });

    it('should not have browse_url', function () {
      var hceInstanceData = [
        {
          vcs_type: 'BITBUCKET',
          vcs_id: 'test_id_2',
          browse_url: 'bitbucket_url'
        },
        {
          vcs_type: 'GITHUB',
          vcs_id: 'test_id_3'
        }
      ];
      var supported = hceSupport.getSupportedVcsInstances(hceInstanceData);
      expect(angular.isArray(supported)).toBe(true);
      expect(supported.length).toBe(1);
      expect(supported[0].label).toBe('GitHub');
      expect(supported[0].browse_url).not.toBeDefined();
    });
  });
})();
