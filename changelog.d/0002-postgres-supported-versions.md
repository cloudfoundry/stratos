[Chores]
- Documented the supported PostgreSQL versions (14 and later, matching what the
  upstream `lib/pq` driver tests against) and removed the PostgreSQL 9.4 service
  plan from the Cloud Foundry database-binding example, which had been telling
  operators to provision a major that left upstream support in 2020.
