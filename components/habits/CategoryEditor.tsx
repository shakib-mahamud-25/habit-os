'use client';
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useAppData } from '@/hooks/useAppData';
import { useToast } from '@/components/ui/Toast';
import { Category } from '@/types';
import { HABIT_ICON_CHOICES, resolveIcon } from '@/lib/icons';

const COLOR_CHOICES = ['#3F6B57', '#C4793F', '#6B84AE', '#8A6BAE', '#B3563F', '#3F8FAE', '#AE6B9C', '#7A8A3F'];

export function CategoryEditor({ category, onClose }: { category: Category | null; onClose: () => void }) {
  const { categories, saveCategory } = useAppData();
  const { toast } = useToast();
  const [name, setName] = useState(category?.name || '');
  const [color, setColor] = useState(category?.color || COLOR_CHOICES[categories.length % COLOR_CHOICES.length]);
  const [iconName, setIconName] = useState(category?.icon || 'Circle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const next: Category = {
      id: category?.id || '',
      name: trimmed,
      color,
      icon: iconName,
      sortOrder: category?.sortOrder ?? 999,
    };
    await saveCategory(next);
    toast(category ? 'Category updated' : 'Category created');
    onClose();
  };

  return (
    <Modal title={category ? 'Edit category' : 'New category'} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field">
          <label className="field-label">Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required autoFocus />
        </div>
        <div className="field">
          <label className="field-label">Color</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {COLOR_CHOICES.map((c) => (
              <button
                type="button" key={c}
                className={`color-swatch ${color === c ? 'sel' : ''}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
                aria-label={c}
              />
            ))}
          </div>
        </div>
        <div className="field">
          <label className="field-label">Icon</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {HABIT_ICON_CHOICES.map((ic) => {
              const Icon = resolveIcon(ic);
              return (
                <button
                  type="button" key={ic}
                  className={`icon-btn ${iconName === ic ? 'sel' : ''}`}
                  onClick={() => setIconName(ic)}
                  aria-label={ic}
                >
                  <Icon size={16} />
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Save category</button>
        </div>
      </form>
    </Modal>
  );
}
