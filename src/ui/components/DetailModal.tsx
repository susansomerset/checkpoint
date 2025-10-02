/**
 * ui.DetailModal v1.0.1
 * Spec: spec/current.json
 * 
 * Modal for displaying raw DetailRow snapshot JSON
 * Features: Collapsible tree (react-json-tree), search, copy to clipboard
 */

'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { JSONTree } from 'react-json-tree';
import { useRawDetailSnapshot } from '@/ui/hooks/useRawDetailSnapshot';

interface DetailModalProps {
  row: {
    studentId: string;
    courseId: string;
    assignmentId: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

// JSON tree theme (monokai-inspired)
const theme = {
  scheme: 'monokai',
  author: 'wimer hazenberg (http://www.monokai.nl)',
  base00: '#272822',
  base01: '#383830',
  base02: '#49483e',
  base03: '#75715e',
  base04: '#a59f85',
  base05: '#f8f8f2',
  base06: '#f5f4f1',
  base07: '#f9f8f5',
  base08: '#f92672',
  base09: '#fd971f',
  base0A: '#f4bf75',
  base0B: '#a6e22e',
  base0C: '#a1efe4',
  base0D: '#66d9ef',
  base0E: '#ae81ff',
  base0F: '#cc6633'
};

export function DetailModal({ row, isOpen, onClose, title }: DetailModalProps) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const getSnapshot = useRawDetailSnapshot();

  // Ensure we're mounted and resolve portal root (client-side only)
  useEffect(() => {
    setMounted(true);
    const el = document.getElementById('portal-root') || document.body;
    setPortalRoot(el as HTMLElement);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  // Early return if not open or not mounted (after all hooks)
  if (!isOpen || !row || !mounted || !portalRoot) {
    return null;
  }

  // Fetch snapshot using hook
  const snapshot = getSnapshot ? getSnapshot({
    studentId: row.studentId,
    courseId: row.courseId,
    assignmentId: row.assignmentId
  }) : null;

  // Get assignment details from snapshot
  const assignmentName = (snapshot?.assignment?.canvas as { name?: string } | undefined)?.name || 'Unknown';
  const points = (snapshot?.assignment as { pointsPossible?: number } | undefined)?.pointsPossible;
  const status = (snapshot?.assignment?.meta as { checkpointStatus?: string } | undefined)?.checkpointStatus || '';
  const fullTitle = `Assignment: ${assignmentName}${points !== undefined ? ` (${points})` : ''} - ${status}`;

  // Handle copy to clipboard
  const handleCopy = async () => {
    if (!snapshot) return;

    const jsonString = JSON.stringify(snapshot, null, 2);

    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-secure contexts
      const textarea = document.createElement('textarea');
      textarea.value = jsonString;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Failed to copy to clipboard:', fallbackErr);
      } finally {
        document.body.removeChild(textarea);
      }
    }
  };

  // shouldExpandNodeInitially - expand only top level
  const shouldExpandNode = (keyPath: readonly (string | number)[], data: unknown, level: number) => {
    // Always expand top level (student, course, assignment)
    return level === 0;
  };

  // Max z-index to win all stacking context wars
  const WRAPPER_STYLE: React.CSSProperties = { 
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2147483647,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  // Fallback if snapshot not available
  const fallbackContent = !snapshot ? (
    <div 
      style={WRAPPER_STYLE}
      onClick={onClose}
    >
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', pointerEvents: 'none' }} />
      <div 
        className="bg-white rounded-lg p-6 max-w-md"
        style={{ position: 'relative', zIndex: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-gray-600">Data not available for this assignment.</p>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Close
        </button>
      </div>
    </div>
  ) : null;

  const modalContent = snapshot ? (
    <div 
      style={WRAPPER_STYLE}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', pointerEvents: 'none' }} />
      <div 
        className="bg-white rounded-lg shadow-xl flex flex-col"
        style={{ position: 'relative', zIndex: 1, margin: '1rem', width: '65%', maxHeight: '80vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 id="modal-title" className="text-lg font-bold text-gray-900">
            {title || fullTitle}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none focus:outline-none focus:ring-2 focus:ring-blue-500 px-2"
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
        </div>

        {/* JSON Tree */}
        <div className="overflow-auto rounded-b-lg" style={{ height: '400px', fontSize: '12px', padding: '1rem', backgroundColor: '#000000' }}>
          <JSONTree
            data={snapshot}
            theme={theme}
            invertTheme={false}
            shouldExpandNodeInitially={shouldExpandNode}
          />
        </div>
      </div>
    </div>
  ) : null;

  // Render using portal to dedicated #portal-root with max z-index
  const content = fallbackContent || modalContent;
  
  return createPortal(content, portalRoot);
}

