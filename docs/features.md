# Features

Stratos UI provides the feature set outline below. Some of these are illustrated in the [Screenshots gallery](images/screenshots/README.md).

* Authentication
   * User authentication using a configured UAA instance
   * Two supported personas - Console admins and Console users

* Internationalization
   * All screen strings are localizable
   * See the [i18n](i18n.md) page for more information

* Endpoint Management<sup>1</sup>
   * The ability for an administrator to register one or more Cloud Foundry clusters to be managed through the UI.
   * Ability for users to connect to Cloud Foundry clusters with their own credentials so that they receive the correct level of access to these clusters

 * Applications View
    * The ability to view all applications in multiple Cloud Foundry clusters in a single view, either as a grid or list
    * Ability to filter the applications shown in numerous ways
       * In a specific Cloud Foundry cluster, organization or space
       * Matching a specific name or part of name
    * Ability to sort applications by Name, Instance Count, Disk Quota, Memory and Creation Date (default)

  * Application View
     * The ability to see the detail for a specific application with a tabbed view providing detailed information:
        *  Summary Tab - showing key application metadata, instance information, routes and bound services
        * Log Stream - providing a live stream of the application log over Web Sockets
        * Services - providing the ability to bind services to an application and manage bindings.
        * Variables - providing the ability to view, edit, add and delete variables
        * Events - showing a paginated view of application events
        * SSH - showing an embedded terminal that can be used to SSH into an application instance directly from the browser
      * The ability to manage the life-cycle of the application (Stop, Start, Restart, Delete) and view the application
      * The ability to rename an application change its memory allocation, scale the number of instances and manage SSH access for the application
      * The ability to view CLI help that explains common CLI commands in the context of the current application
  * Add Application
    * Allows the user to easily create a new application
  * Deploy Application
    * Allows the user to perform the equivalent of a 'cf push' from the browser - pushing an application from code located in a public GitHub project.
* Cloud Foundry View
    * Allows users to view Cloud Foundry metadata and quota information and drill down in the Organization and Space structures.
    * Administrators can additionally view Feature Flags, Buildpacks, Stacks and Security Groups.
    * Administrations can view a streaming log of the Cloud Foundry Firehose.
    * Manage users and their roles
    * Manage Spaces
       * Create, rename and delete spaces
       * View the applications, service instances and routes for a given space
       * Manage SSH Access for space
    * The ability to view CLI help that explains common CLI commands in the context of the current cluster, organization and space


  
> (1): Endpoint Management is disabled by default when the Console is deployed as a Cloud Foundry application.