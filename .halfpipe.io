team: engineering-enablement
pipeline: stratos
tasks:
- type: run
  name: snpaas-cf-stratos
  script: ./run
  docker:
    image: ubuntu
- type: deploy-cf
  api: https://api.snpaas.eu
  space: live
  org: engineering-enablement
