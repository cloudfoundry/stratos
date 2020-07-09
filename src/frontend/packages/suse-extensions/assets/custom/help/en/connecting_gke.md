# Connecting to Google Kubernetes Engine

You can connect a Google Kubernetes Engine (GKE Cluster) using Application Default Credentials.

To obtain a credentials file to upload, you should:

1. Install the **gcloud** Command Line Interface
1. Run the command: `gcloud auth application-default login`
1. Authenticate with Google in the opened web browser to obtain credentials

A credentials file will be written to:

```
~/.config/gcloud/application_default_credentials.json
```

This is the file that you should use when connecting in the endpoint connection dialog.

> Note: You may need to copy this file to a non-hidden folder in order to be able to browse to it in the UI (or enable hidden files in your OS's file browser)

> Note: For more information on obtaining Application Default Credentials, refer to https://cloud.google.com/sdk/gcloud/reference/auth/application-default/login