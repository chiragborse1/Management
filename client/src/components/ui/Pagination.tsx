import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from './Button';

export interface PaginationProps {
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function Pagination({ page, pages, onPageChange, className }: PaginationProps) {
  const isFirstPage = page <= 1;
  const isLastPage = page >= pages;

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex items-center justify-between gap-4', className)}
    >
      <Button
        variant="outline"
        size="sm"
        disabled={isFirstPage}
        onClick={() => onPageChange(page - 1)}
        leftIcon={<ChevronLeft className="h-4 w-4" aria-hidden="true" />}
      >
        Previous
      </Button>
      <span className="text-muted-foreground text-sm">
        Page <span className="text-foreground font-medium">{page}</span> of {pages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={isLastPage}
        onClick={() => onPageChange(page + 1)}
        rightIcon={<ChevronRight className="h-4 w-4" aria-hidden="true" />}
      >
        Next
      </Button>
    </nav>
  );
}
