'use client';
import { useRef, useEffect } from 'react';

interface PromptFieldProps {
  selectedNode: any;
  setSelectedNode: (node: any) => void;
  commandActive: boolean;
  setCommandActive: (active: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  onSubmit?: (prompt: string) => void;
}

export default function PromptField({
  selectedNode,
  setSelectedNode,
  commandActive,
  setCommandActive,
  setSidebarCollapsed,
  onSubmit,
}: PromptFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when bar opens
  useEffect(() => {
    if (commandActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [commandActive]);

  // ESC key closes the bar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && commandActive) {
        closeAll();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const closeAll = () => {
    setCommandActive(false);
    setSidebarCollapsed(true);
    // selectedNode deliberately NOT cleared here — only chip X button does that
  };

  // Mascot click: open if closed, close if open
  const handleMascotClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (commandActive) {
      closeAll();
    } else {
      setCommandActive(true);
    }
  };

  const handleCloseChip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNode(null);
    setSidebarCollapsed(true);
    // Keep bar open but remove the node chip
  };

  return (
    <>
      {/* Mascot Image */}
      <img
        src="/mascot.png"
        id="mascot-img"
        className={
          !commandActive
            ? 'mascot-idle'
            : selectedNode
            ? 'mascot-active has-chip'
            : 'mascot-active'
        }
        alt="PShift Mascot"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={handleMascotClick}
      />

      {/* Command Wrapper */}
      <div
        className={`command-wrapper ${commandActive ? 'show-wrapper active-input' : ''}`}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`suggestions ${commandActive && selectedNode ? 'visible' : ''}`}>
          <div className="sugg-btn-container">
            <button className="sugg-btn">
              Add a section for upcoming events ...{' '}
              <span className="num">1</span>
            </button>
          </div>
          <div className="sugg-btn-container">
            <button className="sugg-btn">
              Create a "Join Now" registration form{' '}
              <span className="num">2</span>
            </button>
          </div>
        </div>

        <div className="command-bar-container">
          <div className="glow-wrapper">
            <div className="glow-blob"></div>
          </div>
          <div className="command-bar">
            {/* Context chip — shown when a node is selected */}
            <div
              className="context-chip-row"
              style={{ display: selectedNode ? 'block' : 'none' }}
            >
              <div className="context-chip">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: '#818cf8' }}
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span>{selectedNode?.label ?? selectedNode?.title ?? 'Node'}</span>
                <button className="cc-close" onClick={handleCloseChip}>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            <input
              type="text"
              ref={inputRef}
              placeholder="What would you like to change or create?"
              onFocus={() => setCommandActive(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    if (onSubmit && inputRef.current?.value) {
                        onSubmit(inputRef.current.value);
                        inputRef.current.value = '';
                        closeAll();
                    }
                }
              }}
              // NOTE: onBlur intentionally omitted — close only via ESC or mascot click
            />

            <div className="controls-row">
              <div className="left-controls">
                <button className="icon-btn-cb">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
                <button className="icon-btn-cb" style={{ fontWeight: 600 }}>/</button>
              </div>

              <div className="right-controls">
                <button className="icon-btn-cb">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    <rect x="14" y="6" width="2" height="6"></rect>
                  </svg>
                </button>
                <div className="model-pill">
                  3 Flash
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 4 }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
                <button className="icon-btn-cb">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" x2="12" y1="19" y2="22" />
                    <path d="M18 4l1 1 1-1-1-1z" fill="currentColor" />
                    <path d="M20 7l1 1 1-1-1-1z" fill="currentColor" />
                  </svg>
                </button>
                <button className="submit-btn-cb" onClick={() => {
                    if (onSubmit && inputRef.current?.value) {
                        onSubmit(inputRef.current.value);
                        inputRef.current.value = '';
                        closeAll();
                    }
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
