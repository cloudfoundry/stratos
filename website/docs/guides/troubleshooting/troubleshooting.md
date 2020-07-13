---
id: troubleshooting
title: Troubleshooting
sidebar_label: Troubleshooting 
---

## Deploying as a Cloud Foundry Application
See the custom troubleshooting guide [here](../../deploy/cloud-foundry#troubleshooting).

## Usernames appear as long random characters when connected to IBM Cloud

### Problem
Connecting to an IBM Cloud with the address `https://api.<custom region>.bluemix.net` avoids a proxy, `https://mccp.<custom region>.bluemix.net`,
that IBM tools use to flesh out users with their username. This results in a missing `username` field, which we fill with the user's `guid`
instead. 

### Solution
Unregister the IBM Cloud endpoint that contains the address `https://api.<custom region>.bluemix.net` and register again with the address
`https://mccp.<custom region>.bluemix.net`

