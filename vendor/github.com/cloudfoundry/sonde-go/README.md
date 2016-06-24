# sonde-go
Go implementation of Cloud Foundry's Dropsonde Protocol

## Libraries sharing this protocol

* [Dropsonde](https://github.com/cloudfoundry/dropsonde) is a Go library for applications that wish to emit messages in this format.
* [NOAA](https://github.com/cloudfoundry/noaa) is a library (also in Go) for applications that wish to consume messages from the Cloud Foundry [metric system](https://github.com/cloudfoundry/loggregator).

## Generating Code

1. Install [protobuf](https://github.com/google/protobuf)
   ```
   brew install protobuf
   ```
1. Generate go code
   ```
   ./generate-go.sh
   ```

Code will be generated within this directory using the proto files from [Dropsonde Protocol](https://github.com/cloudfoundry/dropsonde-protocol). For other languages, message documentation, and communication protocols, reference [Dropsonde Protocol](https://github.com/cloudfoundry/dropsonde-protocol).
