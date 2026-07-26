'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { getCompetitors } from '@/lib/api';

function CompanyPageWrapperContent() {
  const params = useParams();
  const router = useRouter();
  const domainParam = typeof params.domain === 'string' ? params.domain : '';

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function resolveDomainToId() {
      if (!domainParam) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const res = await getCompetitors();
      if (res.ok && Array.isArray(res.data)) {
        const normTarget = domainParam.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
        const match = res.data.find((c) => {
          if (!c.website) return false;
          const normWeb = c.website.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
          return normWeb.includes(normTarget) || normTarget.includes(normWeb);
        });

        if (match) {
          router.replace(`/competitors/${match.id}`);
          return;
        }
      }

      setNotFound(true);
      setLoading(false);
    }

    resolveDomainToId();
  }, [domainParam, router]);

  if (loading) {
    return (
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', color: 'var(--text-secondary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>Resolving Company Domain...</div>
          <div style={{ fontSize: 14, opacity: 0.6 }}>Locating competitor by domain target ({domainParam})</div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', color: 'var(--text-secondary)' }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Company Not Tracked</div>
        <div style={{ fontSize: 15, marginBottom: 24 }}>
          No tracked competitor matches domain <strong>{domainParam}</strong> in your workspace.
        </div>
        <button
          onClick={() => router.push('/competitors')}
          style={{
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: 8,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          View All Monitored Competitors
        </button>
      </div>
    </div>
  );
}

export default function CompanyDomainPage() {
  return (
    <Suspense fallback={<div className="main-content" />}>
      <CompanyPageWrapperContent />
    </Suspense>
  );
}
