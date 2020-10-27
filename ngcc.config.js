// Ignore the deep import warnings on the AJSF library
module.exports = {
  packages: {
    '@cfstratos/ajsf-core': {
      ignorableDeepImportMatchers: [
        /lodash\//,
        /json-schema-draft-06.json$/,
      ]
    },
    '@cfstratos/ajsf-material': {
      ignorableDeepImportMatchers: [
        /lodash\//,
      ]
    },
  },
};
