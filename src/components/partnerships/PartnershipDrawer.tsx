'use client';

import { ArrowRight, ExternalLink, Info, Sparkles, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { logoUrl } from '@/lib/logos';
import type { GraphNode } from '@/components/partnerships/types';
import { formatRelType } from '@/hooks/use-partnerships-graph';

interface PartnershipDrawerProps {
  selectedNode: GraphNode;
  entityBrief: string | null;
  briefLoading: boolean;
  onClose: () => void;
  onAskAi: () => void;
}

export default function PartnershipDrawer({ selectedNode, entityBrief, briefLoading, onClose, onAskAi }: PartnershipDrawerProps) {
  const router = useRouter();
  const logoSrc = selectedNode.domain ? logoUrl(selectedNode.domain) : null;

  return (
    <div
      className="glass-dock partnership-drawer"
      onMouseDown={e => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: 76,
        right: 24,
        bottom: 24,
        width: 350,
        maxWidth: 'calc(100vw - 48px)',
        borderRadius: '20px',
        zIndex: 30,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'slideInRight 0.26s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Subtle top warm accent rim */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 20,
          right: 20,
          height: 1,
          background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
          opacity: 0.65,
        }}
      />

      {/* Drawer Header */}
      <div
        style={{
          padding: '16px 18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: selectedNode.type === 'company' ? '12px' : '50%',
              background: selectedNode.color || 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '1rem',
              boxShadow: `0 0 20px ${selectedNode.color}33`,
              border: '1px solid rgba(255, 255, 255, 0.15)',
              overflow: 'hidden',
            }}
          >
            {logoSrc ? (
              <Image
                src={logoSrc}
                alt={selectedNode.label}
                width={38}
                height={38}
                unoptimized
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { (e.target as HTMLElement).style.display = 'none'; }}
              />
            ) : (
              selectedNode.label.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '1.05rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              {selectedNode.label}
            </h3>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 600,
                color: 'var(--accent)',
                marginTop: 2,
              }}
            >
              {selectedNode.type}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="glass-pill"
          style={{
            padding: 6,
            borderRadius: '8px',
          }}
          title="Close Inspector"
        >
          <X size={16} />
        </button>
      </div>

      {/* Drawer Scrollable Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Quick Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div
            className="glass-pill"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              borderRadius: '14px',
              padding: '12px 14px',
              cursor: 'default',
            }}
          >
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Alliances
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#ffffff', marginTop: 4 }}>
              {selectedNode.partnerCount}
            </div>
          </div>
          <div
            className="glass-pill"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              borderRadius: '14px',
              padding: '12px 14px',
              cursor: 'default',
            }}
          >
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Ecosystem Role
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 6 }}>
              {selectedNode.isHub ? 'Primary Hub' : 'Partner Satellite'}
            </div>
          </div>
        </div>

        {/* Prominent Company Brief / Overview */}
        <div
          className="glass-pill"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            borderRadius: '14px',
            padding: '13px 15px',
            cursor: 'default',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-secondary)',
              marginBottom: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Info size={13} style={{ color: 'var(--accent)' }} />
            <span>About {selectedNode.label}</span>
          </div>
          {briefLoading ? (
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              Loading company brief…
            </div>
          ) : (
            <p style={{ fontSize: '0.83rem', lineHeight: 1.55, color: 'var(--text-secondary)', margin: 0 }}>
              {entityBrief || `${selectedNode.label} is an active ${selectedNode.type} with ${selectedNode.partnerCount} direct alliances in the competitive graph.`}
            </p>
          )}
        </div>

        {/* Connected Partners List */}
        <div>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-secondary)',
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>Direct Alliances ({selectedNode.connectedPartners.length})</span>
            <Sparkles size={12} style={{ color: 'var(--accent)' }} />
          </div>

          {selectedNode.connectedPartners.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {selectedNode.connectedPartners.map((partner, pIdx) => (
                <div
                  key={`${partner.id}-${pIdx}`}
                  className="glass-pill"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderRadius: '12px',
                    padding: '9px 12px',
                    width: '100%',
                    cursor: 'default',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: partner.type === 'company' ? '8px' : '50%',
                        background: partner.color || 'rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        flexShrink: 0,
                      }}
                    >
                      {partner.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {partner.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 1 }}>
                        {formatRelType(partner.relType)}
                      </div>
                    </div>
                  </div>

                  {partner.domain && (
                    <button
                      onClick={() => router.push(`/company/${partner.domain}`)}
                      className="glass-pill"
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                      title={`View ${partner.name}`}
                    >
                      <ExternalLink size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '8px 0' }}>
              No direct alliances recorded for this entity yet.
            </div>
          )}
        </div>
      </div>

      {/* Drawer Actions Footer */}
      <div
        style={{
          padding: '14px 18px',
          borderTop: '1px solid rgba(255, 255, 255, 0.07)',
          background: 'rgba(255, 255, 255, 0.02)',
          display: 'flex',
          gap: 10,
        }}
      >
        {selectedNode.domain && (
          <button
            onClick={() => router.push(`/company/${selectedNode.domain}`)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '10px 16px',
              borderRadius: '12px',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: 'var(--accent)',
              color: '#ffffff',
              boxShadow: '0 4px 16px color-mix(in srgb, var(--accent) 40%, transparent)',
              transition: 'all 0.2s ease',
            }}
          >
            <span>Company Profile</span>
            <ArrowRight size={14} />
          </button>
        )}
        <button
          onClick={onAskAi}
          className="glass-pill"
          style={{
            flex: selectedNode.domain ? undefined : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '10px 16px',
            borderRadius: '12px',
            fontSize: '0.84rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}
        >
          <Sparkles size={14} style={{ color: 'var(--accent)' }} />
          <span>Ask AI</span>
        </button>
      </div>
    </div>
  );
}
