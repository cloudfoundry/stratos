(function () {
  'use strict';

  describe('cloud-foundry vcs model', function () {
    var $httpBackend, $q, vcsModel, modelManager;

    beforeEach(module('templates'));
    beforeEach(module('green-box-console'));
    beforeEach(inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      $q = $injector.get('$q');
      modelManager = $injector.get('app.model.modelManager');
      vcsModel = modelManager.retrieve('cloud-foundry.model.vcs');
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    describe('listVcsClients', function () {

      var vcsClients = {
        clientA: true
      };

      it('Nothing cached', function () {
        $httpBackend.expect('GET', '/pp/v1/vcs/clients').respond(200, vcsClients);

        vcsModel.listVcsClients().then(function (response) {
          expect(response).toEqual(vcsClients);
        });

        $httpBackend.flush();
        expect(vcsModel.vcsClients).toEqual(vcsClients);
      });

      it('force, but nothing cached', function () {
        $httpBackend.expect('GET', '/pp/v1/vcs/clients').respond(200, vcsClients);

        vcsModel.listVcsClients().then(function (response) {
          expect(response).toEqual(vcsClients);
        });

        $httpBackend.flush();
        expect(vcsModel.vcsClients).toEqual(vcsClients);
      });

      it('failed call does not change vcsClients', function () {
        $httpBackend.expect('GET', '/pp/v1/vcs/clients').respond(500, {});
        vcsModel.vcsClients = 'should not change';

        vcsModel.listVcsClients().then(function () {
          fail('Failed call should not result in resolved promise');
        });

        $httpBackend.flush();
        expect(vcsModel.vcsClients).toEqual('should not change');
      });

      it('fetched cached', function () {
        vcsModel.vcsClients = vcsClients;

        vcsModel.listVcsClients().then(function (response) {
          expect(response).toEqual(vcsClients);
          expect(vcsModel.vcsClients).toEqual(vcsClients);
        });
      });
    });

    describe('getSupportedVcsInstances', function () {

      it('no hceVcsInstances', function () {
        vcsModel.supportedVcsInstances = 'junk';
        vcsModel.getSupportedVcsInstances().then(function (output) {
          expect(output).toEqual([]);
          expect(vcsModel.supportedVcsInstances).toEqual([]);
        });
      });

      it('empty hceVcsInstances', function () {
        vcsModel.supportedVcsInstances = 'junk';
        vcsModel.getSupportedVcsInstances([]).then(function (output) {
          expect(output).toEqual([]);
          expect(vcsModel.supportedVcsInstances).toEqual([]);
        });
      });

      it('listVcsClients fails', function () {
        spyOn(vcsModel, 'listVcsClients').and.returnValue($q.reject());

        var supportedInstaces = 'original supportedVcsInstances';

        vcsModel.supportedVcsInstances = supportedInstaces;
        vcsModel.getSupportedVcsInstances(['something'])
          .then(function () {
            fail('Failed call to listVcsClients should result in rejected promise');
          })
          .catch(function () {
            expect(vcsModel.supportedVcsInstances).toEqual(supportedInstaces);
          });

      });

      it('listVcsClients succeeds', function () {
        var vcsClients = ['https://github.com/something', 'www.fisherpricesgithubenterprise.com'];
        var input = [
          {
            label: 'Valid - Github',
            vcs_type: 'GITHUB',
            browse_url: 'https://github.com/something'
          },
          {
            label: 'Invalid - browse_url not in vcsClients',
            vcs_type: 'GITHUB',
            browse_url: 'https://github.com/something/else/but/not/in/vcsClients'
          },
          {
            label: 'Valid - Github enterprise',
            vcs_type: 'GITHUB',
            browse_url: 'www.fisherpricesgithubenterprise.com'
          },
          {
            label: 'Invalid - unrecognised vcs_type',
            vcs_type: 'JUNK',
            browse_url: 'https://github.com/something'
          }
        ];
        var expectedOutput = [{
          description: 'Connect to a repository hosted on GitHub.com that you own or have admin rights to.',
          img: 'github_octocat.png',
          supported: true,
          label: 'Valid - Github',
          browse_url: 'https://github.com/something',
          value: {
            label: 'Valid - Github',
            vcs_type: 'GITHUB',
            browse_url: 'https://github.com/something'
          }
        },
          {
            description: 'Connect to a repository hosted on your on-premise Github Enterprise instance that you own or have admin rights to.',
            img: 'GitHub-Mark-120px-plus.png',
            supported: true,
            label: 'Valid - Github enterprise',
            browse_url: 'www.fisherpricesgithubenterprise.com',
            value: {
              label: 'Valid - Github enterprise',
              vcs_type: 'GITHUB',
              browse_url: 'www.fisherpricesgithubenterprise.com'
            }
          }
        ];

        spyOn(vcsModel, 'listVcsClients').and.callFake(function () {
          vcsModel.vcsClients = vcsClients;
          return $q.resolve(vcsClients);
        });

        vcsModel.supportedVcsInstances = 'original supportedVcsInstances';

        vcsModel.getSupportedVcsInstances(input)
          .then(function (output) {
            expect(output).toEqual(expectedOutput);
            expect(vcsModel.supportedVcsInstances).toEqual(expectedOutput);
          })
          .catch(function () {
            fail('Successful call to listVcsClients should not result in rejected promise');
          });

      });

    });
  });

})();
