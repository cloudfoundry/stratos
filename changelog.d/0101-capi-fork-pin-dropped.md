[Maintainability]
- The backend's CF API client dependency, fivetwenty-io/capi, moves to
  the released v3.236.2 instead of a personal fork. The release carries
  the two client fixes Stratos was pinned to the fork for: a
  user-provided service instance delete that CF answers with 204, and
  the HTTP status of a CF 5xx that outlasts the client's retries.
