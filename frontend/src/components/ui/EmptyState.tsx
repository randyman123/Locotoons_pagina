import { type ReactNode } from 'react';

type EmptyStateProps = {
  tag: string;
  title: string;
  description: string;
  action?: ReactNode;
  compact?: boolean;
};

export function EmptyState({ tag, title, description, action, compact = false }: EmptyStateProps) {
  return (
    <div className={compact ? 'empty-state-card compact-empty-state' : 'empty-state-card'}>
      <span className="hero-tag">{tag}</span>
      <h1>{title}</h1>
      <p>{description}</p>
      {action ? <div className="empty-state-actions">{action}</div> : null}
    </div>
  );
}
