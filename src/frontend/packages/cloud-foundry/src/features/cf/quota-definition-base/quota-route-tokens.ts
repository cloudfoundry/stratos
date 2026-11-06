// Route-query-param token used by the legacy add/edit quota wizards to
// signal "the user navigated here from the quotas list" so they can
// route back to the right place after save. The signal-native quota
// list emits this same token when it eventually wires up edit
// affordances; for now only the still-legacy wizards consume it.
export const QUOTA_FROM_LIST = 'list';
