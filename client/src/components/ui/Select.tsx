import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  onChange?: (value: string) => void;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, options, placeholder, error, value, onChange, className, ...props },
  ref
) {
  return (
    <div className={cn('flex w-full flex-col gap-1.5', className)}>
      {label && <label className="text-foreground text-sm leading-none font-medium">{label}</label>}
      <div className="relative">
        <select
          ref={ref}
          value={value ?? ''}
          aria-invalid={error ? true : undefined}
          onChange={(event) => onChange?.(event.target.value)}
          className={cn(
            'border-input bg-background text-foreground focus-visible:ring-ring flex h-10 w-full appearance-none rounded-md border px-3 py-2 pr-9 text-sm shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive focus-visible:ring-destructive'
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2"
          aria-hidden="true"
        />
      </div>
      {error && <p className="text-destructive text-xs font-medium">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
