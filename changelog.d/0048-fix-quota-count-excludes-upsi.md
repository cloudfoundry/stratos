[BugFixes]
- The Service Instances count on the organization and space Summary pages excludes user-provided service instances again, matching 4.x. The count is displayed against the service-instance quota, and user-provided instances do not consume that quota, so including them overstated quota usage. User-provided instances keep their own separate tile (#5769).
