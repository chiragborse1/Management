import { Construction, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import { EmptyState } from '@/components/ui';

interface ModulePlaceholderProps {
  title: string;
  description: string;
  icon?: LucideIcon;
}

/**
 * Honest placeholder for routes whose module is built in a later step.
 * The route exists and navigation works — the feature itself is "coming soon"
 * instead of silently redirecting back to the dashboard (the old behavior
 * made sidebar clicks look dead).
 */
export default function ModulePlaceholder({
  title,
  description,
  icon = Construction,
}: ModulePlaceholderProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <EmptyState
        icon={icon}
        title="Module under construction"
        description="This module is part of the next build step — check back soon."
        action={
          <Link to="/admin/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        }
      />
    </div>
  );
}
