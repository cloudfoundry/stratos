# Helper for mc command

# Check if mc command is available (don't log error if it is not)
mc version > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "mc command already installed and confgiured"
else
  echo "Installing and configuring mc command ..."

  wget https://dl.minio.io/client/mc/release/linux-amd64/mc
  chmod +x mc
  cp mc ~/bin

  mc -install -y >/dev/null 2>&1

  echo "Configuring mc client"
  mc config host add s3 ${AWS_ENDPOINT} ${AWS_ACCESS_KEY_ID} ${AWS_SECRET_ACCESS_KEY} --insecure

  echo "mc command ready"
fi
