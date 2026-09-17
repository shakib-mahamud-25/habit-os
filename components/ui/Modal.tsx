'use client';
import React from 'react';
import { X } from 'lucide-react';

export function Modal({
  title, onClose, children, maxWidth = 440,
}: { title: string; onClose: () => void; children: React.ReactNode; maxWidth?: number }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" style={{ maxWidth }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h3 className="serif" style={{ margin: 0 }}>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        <div style={{ marginTop: 14 }}>{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  title, body, confirmLabel, danger = true, onCancel, onConfirm,
}: { title: string; body: string; confirmLabel: string; danger?: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="modal-back" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
        <h3 className="serif" style={{ margin: 0 }}>{title}</h3>
        <p className="muted" style={{ fontSize: 13.5, margin: '8px 0 18px' }}>{body}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onCancel}>Cancel</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} style={{ flex: 1, justifyContent: 'center' }} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
