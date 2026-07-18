import noUnusedSnackbarService from "./rules/no-unused-snackbar-service.mjs";
import noDeadMaterialSelectors from "./rules/no-dead-material-selectors.mjs";
import noHollowAssertions from "./rules/no-hollow-assertions.mjs";

// Repo-local rules, registered in eslint.config.mjs as the "stratos" plugin.
export default {
  rules: {
    "no-unused-snackbar-service": noUnusedSnackbarService,
    "no-dead-material-selectors": noDeadMaterialSelectors,
    "no-hollow-assertions": noHollowAssertions,
  },
};
