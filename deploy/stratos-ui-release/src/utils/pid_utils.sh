#!/usr/bin/env bash

function pid_is_running() {
  declare pid="$1"
  ps -p "${pid}" >/dev/null 2>&1
}

# pid_guard
#
# @param pidfile
# @param name [String] an arbitrary name that might show up in STDOUT on errors
#
# Run this before attempting to start new processes that may use the same :pidfile:.
# If an old process is running on the pid found in the :pidfile:, exit 1. Otherwise,
# remove the stale :pidfile: if it exists.
#
function pid_guard() {
  declare pidfile="$1" name="$2"

  echo "------------ STARTING $(basename "$0") at $(date) --------------" | tee /dev/stderr

  if [ ! -f "${pidfile}" ]; then
    return 0
  fi

  local pid
  pid=$(head -1 "${pidfile}")

  if pid_is_running "${pid}"; then
    echo "${name} is already running, please stop it first"
    exit 1
  fi

  echo "Removing stale pidfile"
  rm "${pidfile}"
}

# wait_pid_death
#
# @param pid
# @param timeout
#
# Watch a :pid: for :timeout: seconds, waiting for it to die.
# If it dies before :timeout:, exit 0. If not, exit 1.
#
# Note that this should be run in a subshell, so that the current
# shell does not exit.
#
function wait_pid_death() {
  declare pid="$1" timeout="$2"

  local countdown
  countdown=$(( timeout * 10 ))

  while true; do
    if ! pid_is_running "${pid}"; then
      return 0
    fi

    if [ ${countdown} -le 0 ]; then
      return 1
    fi

    countdown=$(( countdown - 1 ))
    sleep 0.1
  done
}

# kill_and_wait
#
# @param pidfile
# @param timeout [default 25s]
#
# For a pid found in :pidfile:, send a `kill -15` TERM, then wait for :timeout: seconds to
# see if it dies on its own. If not, send it a `kill -9`. If the process does die,
# exit 0 and remove the :pidfile:. If after all of this, the process does not actually
# die, exit 1.
#
# Note:
# Monit default timeout for start/stop is 30s
# Append 'with timeout {n} seconds' to monit start/stop program configs
#
function kill_and_wait() {
  declare pidfile="$1" timeout="${2:-25}" sigkill_on_timeout="${3:-1}"

  if [ ! -f "${pidfile}" ]; then
    echo "Pidfile ${pidfile} doesn't exist"
    exit 0
  fi

  local pid
  pid=$(head -1 "${pidfile}")

  if [ -z "${pid}" ]; then
    echo "Unable to get pid from ${pidfile}"
    exit 1
  fi

  if ! pid_is_running "${pid}"; then
    echo "Process ${pid} is not running"
    rm -f "${pidfile}"
    exit 0
  fi

  echo "Killing ${pidfile}: ${pid} "
  kill "${pid}"

  if ! wait_pid_death "${pid}" "${timeout}"; then
    if [ "${sigkill_on_timeout}" = "1" ]; then
      echo "Kill timed out, using kill -9 on ${pid}"
      kill -9 "${pid}"
      sleep 0.5
    fi
  fi

  if pid_is_running "${pid}"; then
    echo "Timed Out"
    exit 1
  else
    echo "Stopped"
    rm -f "${pidfile}"
  fi
}
