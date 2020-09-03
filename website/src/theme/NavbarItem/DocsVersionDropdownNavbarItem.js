/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { useActiveDocContext, useLatestVersion, useVersions } from '@theme/hooks/useDocs';
import React from 'react';

import versionsWithHash from '../../../internal-versions.json';
import DefaultNavbarItem from '../../../node_modules/@docusaurus/theme-classic/lib/theme/NavbarItem/DefaultNavbarItem';

const versionLabel = (version, nextVersionLabel) =>
  version.name === 'next' ? nextVersionLabel : version.name;

const getVersionMainDoc = (version) =>
  version.docs.find((doc) => doc.id === version.mainDocId);

const createStratosVersions = (versions) => {
  // Remove certain versions from version drop down
  const newVersions = [];
  const pastVersions = versionsWithHash.map(versionWithHash => versionWithHash.split(':'))
  versions.forEach(version => {
    const pastVersion = pastVersions.find(pastVersion => pastVersion[0] === version.name)
    if (version.name === 'next' || (pastVersion && pastVersion[2] === 'true')) {
      newVersions.push(version)
    }
  })
  return newVersions;
}

export default function DocsVersionDropdownNavbarItem({
  mobile,
  docsPluginId,
  nextVersionLabel,
  ...props
}) {
  const activeDocContext = useActiveDocContext(docsPluginId);
  const versions = useVersions(docsPluginId);
  const stratosVersions = createStratosVersions(versions)
  const latestVersion = useLatestVersion(docsPluginId);
  const items = stratosVersions.map((version) => {
    // We try to link to the same doc, in another version
    // When not possible, fallback to the "main doc" of the version
    const versionDoc =
      activeDocContext?.alternateDocVersions[version.name] ||
      getVersionMainDoc(version);
    return {
      isNavLink: true,
      label: versionLabel(version, nextVersionLabel),
      to: versionDoc.path,
      isActive: () => version === activeDocContext?.activeVersion,
    };
  });

  // Stratos - Add the 'All Versions' link to the versions drop down
  items.push({
    isNavLink: true,
    label: "All Versions",
    to: "/versions",
    isActive: () => false,
  })

  const dropdownVersion = activeDocContext.activeVersion ?? latestVersion; // Mobile is handled a bit differently

  const dropdownLabel = mobile
    ? 'Versions'
    : versionLabel(dropdownVersion, nextVersionLabel);
  const dropdownTo = mobile
    ? undefined
    : getVersionMainDoc(dropdownVersion).path;
  return (
    <DefaultNavbarItem
      {...props}
      mobile={mobile}
      label={dropdownLabel}
      to={dropdownTo}
      items={items}
    />
  );
}
