mkdir -p src/backend
cd components/app-core/backend
git mv * ../../../src/backend/
cd ../../..
cd src/backend
mkdir cloud-foundry
cd cloud-foundry/
git mv ../../../components/cloud-foundry/backend/* .
cd ..
mkdir cf-app-push
cd cf-app-push/
git mv ../../../components/cf-app-push/backend/* .
cd ..
mkdir cf-app-ssh
cd cf-app-ssh
git mv ../../../components/cf-app-ssh/backend/* .
cd ..
mkdir user-info
cd user-info
git mv ../../../components/user-info/backend/* .
cd ..
echo "All done"
