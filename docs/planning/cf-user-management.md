# Cloud Foundry User Management

## Requirements

* View the organisation and space roles for all users
* Edit the organisation and space roles for a specific user
* Assign multiple organisation and/or space roles for multiple users

## V1

* Users tab + table at CF, organisation and space level
  * CF level shows user _organisation_ roles for all organisations as pills
  * Org level shows user _space_ roles for all spaces as pills
  * Space level shows user _space_ roles for space as pills
* Table provided links to update roles
  * 'Manage' a single user - pop up showing orgs/spaces (depending on level) roles. Allowed edit of all shown roles
  * 'Change' multiple users - similar to manage, however no existing roles were shown. New selection _replaced_ existing roles
  * 'Remove all' roles of selected users. These are specific to the level (cf - remove all orgs/spaces, org - remove all org/spaces, space - remove all space)
* All cf/org/space pages allow user to 'Assign' roles in a pop up
  * pop up contains stepper, one stage to select user/s and another role/s
  * can only assign roles to a single org and it's spaces
  * no existing roles are shown

### V1 Issues

* Handling large amount of orgs or spaces
  * Pill format to represent user roles lead to potentially large blobs of pills which were hard to extract information from but did show
    the data in as small as possible area
  * The Manage/Change popup didn't scale well at the CF level for lots of orgs or org level for lots of spaces
* Only showing org or space roles in the table can lead to confusion, for example user edits org roles at space level and no changes to table.
* Multiple ways to reach the same window (buttons above tables, row actions)
* Can only mass assign roles one org at a time
* No concept of inviting users
  * Need to understand how this would work by supplying an email. API provides a way to create users with their UAA guid

## V2

### First pass implementation - Changes to V1

* 'Change' multiple user modal
  * To be removed. The ability to 'reset' multiple users needs more work.
* 'Manage' single user modal
  * Only allow edit of a single org and it's spaces in the 'Manage' pop up, as per the assign. This restricts functionality but presents the
    information in a clearer way and scales much better for multiple orgs.
  * Tidy the position of 'remove from org'
  * Stretch - Remove the 'org user' and handle automatically in the background?
* 'Assign'
  * Step 2 - Ensure consistent UX with 'Manage' or vice versa
* Users Tab/Table
  * Show org and space columns for their roles. Relevant to level (cf - both, org - both, space - space only)
  * Provide a way to collapse list of roles automatically when there's a large amount.
  * Stretch - Provide a way to filter per role. This will allow user to quickly see who's, for instance, a manager.

### Second pass

* Invite/Create user
* Remove user
* Reset users roles

### Design input required pre release

* Validate first pass approach
* Review use case/possible solutions to update/reset multiple users roles
* Review use of pills in table
* Review second roles column in table
* Review Manage/Assign layout

## Similar Implementations

High level description of other CF UIs

* Management at org and space level
  * Roughly table like views
  * Each user listed in rows
  * Org/Space roles as columns
* Editing a users roles by..
  * a check box in the roles column (each change an individual api request at time of click)
  * a pop up allowing edits to all org OR space roles for a specific row/user
  * All edits are very specific to user
* Provide a way to invite new users by email address.
  * Can specify what roles they have at invite time

>> Note .. There's no easy way to check user/s management at Cloud Foundry admin level, which is where some of the fun starts.
