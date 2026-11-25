import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import WebConsoleModal from '../components/WebConsoleModal';

export default function StandaloneConsole() {
  const { vmId, siteId } = useParams<{ vmId?: string; siteId?: string }>();
  const [searchParams] = useSearchParams();

  const vmName = searchParams.get('name') || undefined;
  const vmIp = searchParams.get('ip') || undefined;
  const siteName = searchParams.get('siteName') || undefined;

  return (
    <WebConsoleModal
      standalone
      vmId={vmId}
      siteId={siteId ? Number(siteId) : undefined}
      vmName={vmName}
      siteName={siteName}
      vmIp={vmIp}
      onClose={() => window.close()}
    />
  );
}
