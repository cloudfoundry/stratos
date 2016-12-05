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

      var vcsClients = [{
        browse_url: 'https://github.com',
        vcs_type: 'github'
      }];

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
        spyOn(vcsModel, 'listVcsTokens').and.returnValue($q.reject());
        $httpBackend.when('GET', '/pp/v1/vcs/pat').respond(200, []);

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
        var vcsTokens = [
          {
            token: {
              token: '•••••••••••••••••••••••••••••••••••••452',
              guid: '574719d8-7ffe-48c2-a348-360ee1bd7307',
              vcs_guid: '73039be8-b0fc-42be-acf2-fdf72fb46aa2',
              name: 'Token A'
            },
            vcs: {
              guid: '73039be8-b0fc-42be-acf2-fdf72fb46aa2',
              label: 'Valid - Github',
              vcs_type: 'github',
              browse_url: 'https://github.com/something',
              api_url: 'https://api.github.com/something'
            }
          }, {
            token: {
              token: '•••••••••••••••••••••••••••••••••••••56e',
              guid: '70ad7106-5225-4983-8139-4b0c813e252c',
              vcs_guid: '73039be8-b0fc-42be-acf2-fdf72fb46aa2',
              name: 'Token B'
            },
            vcs: {
              guid: '73039be8-b0fc-42be-acf2-fdf72fb46aa2',
              label: 'Valid - Github enterprise',
              vcs_type: 'github',
              browse_url: 'https://www.fisherpricesgithubenterprise.com',
              api_url: 'https://www.fisherpricesgithubenterprise.com/api'
            }
          }];
        var input = [
          {
            label: 'Valid - Github',
            vcs_type: 'github',
            browse_url: 'https://github.com/something'
          },
          {
            label: 'Invalid - browse_url not in vcsClients',
            vcs_type: 'github',
            browse_url: 'https://github.com/something/else/but/not/in/vcsClients'
          },
          {
            label: 'Valid - Github enterprise',
            vcs_type: 'github',
            browse_url: 'https://www.fisherpricesgithubenterprise.com'
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
          label: 'Valid - Github',
          browse_url: 'https://github.com/something',
          value: vcsTokens[0],
          token_name: 'Token A'
        },
          {
            description: 'Connect to a repository hosted on your on-premise Github Enterprise instance that you own or have admin rights to.',
            img: 'GitHub-Mark-120px-plus.png',
            label: 'Valid - Github enterprise',
            browse_url: 'https://www.fisherpricesgithubenterprise.com',
            value: vcsTokens[1],
            token_name: 'Token B'
          }
        ];
        $httpBackend.when('GET', '/pp/v1/vcs/pat').respond(200, []);
        spyOn(vcsModel, 'listVcsTokens').and.callFake(function () {
          vcsModel.vcsTokens = vcsTokens;
          return $q.resolve(vcsTokens);
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
