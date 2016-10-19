(function (mock) {
  'use strict';

  mock.hceApi = mock.hceApi || {};

  mock.hceApi.HceContainerApi = {

    getBuildContainers: function () {
      return {
        url: '/pp/v1/proxy/v2/containers/build_containers',
        response: {
          200: {
            body: [
              {
                build_container_id: 1,
                build_container_image_id: 1,
                build_container_label: 'Python build container',
                image: {
                  image_id: 1,
                  image_registry_id: 2,
                  image_repo: 'helioncf/hce-base-python',
                  image_tag: 'kosher-prod',
                  image_label: 'Python base',
                  credential_id: null
                }
              }
            ]
          },

          500: {
            body: {}
          }
        }
      };
    },
    getBuildContainer: function (id) {
      return {
        url: '/pp/v1/proxy/v2/containers/build_containers/' + id,
        response: {
          200: {
            build_container_id: id,
            build_container_image_id: 2,
            build_container_label: "NodeJS build container",
            retain_build_artifacts: false,
            image: {
              image_id: 2,
              image_registry_id: 2,
              image_repo: "hce-base-nodejs",
              image_tag: "1.1.30-674c3ba9",
              image_label: "hce_nodejs_base",
              credential_id: null
            }
          },

          500: {
            body: {}
          }
        }
      };
    },

    getImageRegistries: function () {
      return {
        url: '/pp/v1/proxy/v2/containers/images/registries',
        response: {
          200: {
            body: [
              {
                image_registry_id: 1,
                image_type_id: 1,
                registry_url: 'https://index.docker.io/v1',
                registry_label: 'DockerHub 1.0',
                image_type: 'DOCKER'
              },
              {
                image_registry_id: 2,
                image_type_id: 1,
                registry_url: 'https://index.docker.io/v2',
                registry_label: 'DockerHub 2.0',
                image_type: 'DOCKER'
              }
            ]
          },

          500: {
            body: {}
          }
        }
      };
    }
  };

})(this.mock = this.mock || {});
