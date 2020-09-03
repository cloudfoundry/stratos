import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useActivePlugin, useActiveVersion, useDocVersionSuggestions } from '@theme/hooks/useDocs';
import React from 'react';

import styles from './styles.module.css';

const useMandatoryActiveDocsPluginId = () => {
  const activePlugin = useActivePlugin();

  if (!activePlugin) {
    throw new Error(
      'DocVersionCallout is only supposed to be used on docs-related routes',
    );
  }

  return activePlugin.pluginId;
};

const getVersionMainDoc = (version) =>
  version.docs.find((doc) => doc.id === version.mainDocId);

function DocVersionSuggestions() {
  const {
    siteConfig: { title: siteTitle },
  } = useDocusaurusContext();
  const pluginId = useMandatoryActiveDocsPluginId();
  const activeVersion = useActiveVersion(pluginId);
  const {
    latestDocSuggestion,
    latestVersionSuggestion,
  } = useDocVersionSuggestions(pluginId); // No suggestion to be made

  if (!latestVersionSuggestion) {
    return <></>;
  }

  const activeVersionName = activeVersion.name; // try to link to same doc in latest version (not always possible)
  // fallback to main doc of latest version

  const suggestedDoc =
    latestDocSuggestion ?? getVersionMainDoc(latestVersionSuggestion);
  return (
    <div className="alert alert--secondary margin-bottom--md" role="alert" >
      {activeVersionName === 'next' ? (
        <div className={styles.container}>
          This is the development documentation. For the latest released documentation see{' '}
          <strong>
            <Link to={suggestedDoc.path}> {latestVersionSuggestion.name}</Link>
          </strong>.
        </div>
      ) : (
          <div className={styles.container}>
            This is documentation for <strong>{activeVersionName}</strong>. For the latest released documentation see {' '}
            <strong>
              <Link to={suggestedDoc.path}>{latestVersionSuggestion.name}</Link>
            </strong>.
          </div>
        )}
    </div>
  );
}

export default DocVersionSuggestions;
