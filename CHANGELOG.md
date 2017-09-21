# Change Log

## 0.9.2 Alpha-3 Release



## 0.9.1 Alpha-2 Release

Second alpha release contains the following fixes:

1. Improved documentation when deploying using Helm (https://github.com/SUSE/stratos-ui/pull/1201)
2. Added the ability to deploy the Console helm chart without using shared volumes, to make it easier to deploy in multi-node clusters with basic storage provisioner such as `hostpath` (https://github.com/SUSE/stratos-ui/pull/1204)
3. Specified the `cflinuxfs2` stack to the CF manifest.yaml, since default CAASP stack `opensuse42` is unable to deploy the app (https://github.com/SUSE/stratos-ui/pull/1205)
4. Changed root of the volume mount for Postgres in kubernetes to address permission issue in certain environments  (https://github.com/SUSE/stratos-ui/pull/1203)

## 0.9.0 Alpha-1 Release

First Alpha release of the Stratos UI Console.

For information on the Alpha feature set and on deploying the Console, please start with the main [README](https://github.com/SUSE/stratos-ui/blob/0.9.0/README.md) documentation.