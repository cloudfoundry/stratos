#!/usr/bin/env bash

# tee_output_to_sys_log_and_file
#
# @param log_dir [String] the directory where the log file should be written
# @param log_name [String] used to name the log files eg: log_name.log and log_name.err.log
#                          used to tag the syslog message eg: vcap.log_name.stdout and vcap.log_name.stderr
#
# Send stdout and stderr to syslog as well as a specified file. Prepends datetime to output in the log file.
function tee_output_to_sys_log_and_file {
  declare log_dir="$1" log_name="$2"

  exec > >(tee -a >(logger -p user.info -t "vcap.${log_name}.stdout") | prepend_datetime >>"${log_dir}/${log_name}.log")
  exec 2> >(tee -a >(logger -p user.error -t "vcap.${log_name}.stderr") | prepend_datetime >>"${log_dir}/${log_name}.err.log")
}

# tee_output_to_sys_log
#
# @param log_name [String] used to name the log files eg: log_name.log and log_name.err.log
#                          used to tag the syslog message eg: vcap.log_name.stdout and vcap.log_name.stderr
#
# Send stdout and stderr to syslog . Prepends datetime to stdout and stderr.
function tee_output_to_sys_log {
  declare log_name="$1"

  exec > >(tee -a >(logger -p user.info -t "vcap.${log_name}.stdout") | prepend_datetime >> /dev/stdout)
  exec 2> >(tee -a >(logger -p user.error -t "vcap.${log_name}.stderr") | prepend_datetime >> /dev/stderr)
}

function prepend_datetime {
  awk -W interactive '{ system("echo -n [$(date +\"%Y-%m-%d %H:%M:%S%z\")]"); print " " $0 }'
}
