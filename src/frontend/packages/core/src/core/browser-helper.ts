export const getEventTarget = (event) => {
  // Ensure we work on Firefox as well as Chrome etc
  return event.target || event.srcElement;
};

export const getEventFiles = (event) => {
  return getEventTarget(event).files;
};
