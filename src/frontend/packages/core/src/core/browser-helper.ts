export const getEventTarget = (event: Event): EventTarget | null => {
  // Ensure we work on Firefox as well as Chrome etc
  return event.target || (event as any).srcElement;
};

export const getEventFiles = (event: Event): FileList | null => {
  const target = getEventTarget(event) as HTMLInputElement;
  return target?.files || null;
};
