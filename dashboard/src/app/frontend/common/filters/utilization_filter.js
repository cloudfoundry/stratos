
export default function utilizationFilter(numberFilter) {


  let formatUtilization = function(value) {
    // Convert millicores to cores.
    value = value * 100;

    let formatted = numberFilter(value);
    return formatted;
  };

  return formatUtilization;
}
