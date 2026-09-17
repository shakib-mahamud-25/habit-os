import React from 'react';

export function PageHeader({
  title, subtitle, right,
}: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title serif">{title}</h1>
        {subtitle && <div className="page-sub">{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}
