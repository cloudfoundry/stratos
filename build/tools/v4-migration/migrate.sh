#!/usr/bin/env bash

# Migrate custom theme and extensions into the new package structure

set -e
set -o pipefail

# Script folder
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"
STRATOS="`cd "${DIR}/../../..";pwd`"
CUSTOM="${STRATOS}/examples/custom-src"
TEMPLATES=${DIR}/templates

STRATOS_YML=${STRATOS}/stratos.yaml
PKGS=${STRATOS}/src/frontend/packages

echo $CUSTOM

function migrateTitle() {
  if [ -f "${CUSTOM}/stratos.yaml" ]; then
    DATA=$(cat "${CUSTOM}/stratos.yaml")

    # Make sure we have a Stratos.yaml file
    touch ${STRATOS_YML}

    TITLE=$(grep -o 'title: .*' ${CUSTOM}/stratos.yaml)
    sed -i.bak -e '/^title:/d' ${STRATOS_YML}
    echo -e "${TITLE}" >> ${STRATOS_YML}
  fi
}

function migrateTheme() {
  echo "Looking for custom theme"

  # Custom theme if we have custom-src/frontend/sass/custom.scss
  CUSTOM_THEME=${CUSTOM}/frontend/sass/custom.scss
  if [ ! -f ${CUSTOM_THEME} ]; then
    echo "No custom theme found"
    return
  fi

  echo "Custom theme found ... migrating"

  # Create a new package for the theme
  THEME_DIR=${PKGS}/custom_theme

  rm  -rf ${THEME_DIR}
  mkdir ${THEME_DIR}
  mkdir ${THEME_DIR}/sass
  mkdir -p ${THEME_DIR}/assets/core
  mkdir -p ${THEME_DIR}/assets/custom
  mkdir -p ${THEME_DIR}/loader

  cp -R ${CUSTOM}/frontend/sass/* ${THEME_DIR}/sass

  cp ${TEMPLATES}/theme.package.json ${THEME_DIR}/package.json
  cp ${TEMPLATES}/_index.scss ${THEME_DIR}

  cp ${CUSTOM}/frontend/loading.* ${THEME_DIR}/loader/

  # Update the theme in the top-level stratos.yml
  sed -i.bak -e 's/theme: .*/theme: \"@custom\/theme\"/g' ${STRATOS_YML}

  # Copy assets
  cp -R ${CUSTOM}/frontend/assets/* ${THEME_DIR}/assets/core
  # Favicon
  cp -R ${CUSTOM}/frontend/favicon.ico ${THEME_DIR}/assets

  # Remove lines from package.josn that are not required
  if [ ! -f "${THEME_DIR}/assets/favicon.ico" ]; then
    sed -i.bak '/"favicon.ico"$/d' ${THEME_DIR}/package.json
  fi

  # Loading screen
  if [ ! -f "${THEME_DIR}/loader/loading.css" ]; then
    sed -i.bak '/loading.css",$/d' ${THEME_DIR}/package.json
  fi

  if [ ! -f "${THEME_DIR}/loader/loading.html" ]; then
    sed -i.bak '/loading.html"$/d' ${THEME_DIR}/package.json
  fi

  rm -rf ${THEME_DIR}/package.json.bak
}

function migrateExtensions() {
  echo "Looking for custom extensions"

  # Custom theme if we have custom-src/frontend/sass/custom.scss
  CUSTOM_MODULE=${CUSTOM}/frontend/app/custom/custom.module.ts
  if [ ! -f ${CUSTOM_MODULE} ]; then
    echo "No custom extensions found"
    return
  fi

  echo "Custom extensions found ... migrating"

  # Create a new package for the extension(s)
  EXT_DIR=${PKGS}/custom_extensions

  rm  -rf ${EXT_DIR}
  mkdir -p ${EXT_DIR}/src
  cp ${TEMPLATES}/ext.package.json ${EXT_DIR}/package.json
  
  # Copy the source code into the src folder
  cp -R ${CUSTOM}/frontend/app/custom/ ${EXT_DIR}/src
  cp ${TEMPLATES}/public-api.ts_ ${EXT_DIR}/src/public-api.ts

  #IMPORT_LINE=$(awk '/imports:/{ print NR; exit }' ${CUSTOM_MODULE}

  sed -i '' "s/imports: \[/imports: \[ StratosComponentsModule,/" ${EXT_DIR}/src/custom.module.ts

  echo "import { StratosComponentsModule } from '@stratosui/shared';" | cat - ${EXT_DIR}/src/custom.module.ts > ${EXT_DIR}/temp.ts
  mv -f ${EXT_DIR}/temp.ts ${EXT_DIR}/src/custom.module.ts

  if [ -f ${EXT_DIR}/src/custom-routing.module.ts ]; then
    echo -e "\nexport * from './custom-routing.module';\n" >> ${EXT_DIR}/src/public-api.ts

    sed -i '' "s/_routingModule/routingModule/g" ${EXT_DIR}/package.json
  fi

  # Need to update the import references as things will have moved
  pushd ${EXT_DIR}/src

  # Not exhaustive, so extensions developers may need to manually fix imports
  find . -name "*.ts" | xargs sed -i '' "s@'../../core@'../../../core/src/core@g"
  find . -name "*.ts" | xargs sed -i '' "s@'../core/core.module@'../../core/src/core/core.module@g"
  find . -name "*.ts" | xargs sed -i '' "s@'../core/customizations.types@'../../core/src/core/customizations.types@g"
  find . -name "*.ts" | xargs sed -i '' 's@../core/md.module@../../core/src/core/md.module@g'
  find . -name "*.ts" | xargs sed -i '' "s@'../shared/shared.module@'../../core/src/shared/shared.module@g"
  find . -name "*.ts" | xargs sed -i '' "s@'../../../../store/src/app-state@'../../../store/src/app-state@g"
  find . -name "*.ts" | xargs sed -i '' "s@'../../features/login/login-page/login-page.component@'../../../core/src/features/login/login-page/login-page.component@g"

  popd
}

pushd "${STRATOS}" > /dev/null

# Look for custom-src folder


if [ -d "${CUSTOM}" ]; then
  echo "Found customizations to migrate"
else
  echo "No custom src folder exists - nothing to migrate"
  popd > /dev/null
  exit 1
fi

migrateTitle
migrateTheme
#migrateExtensions

popd > /dev/null

cat $STRATOS_YML