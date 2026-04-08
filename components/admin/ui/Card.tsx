import { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-6',
};

export function Card({
  title,
  icon,
  action,
  padding = 'md',
  className = '',
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={`bg-white dark:bg-admin-surface-dark border border-gray-200 dark:border-admin-border-dark rounded-xl shadow-sm ${className}`}
      {...rest}
    >
      {(title || action) && (
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-gray-200 dark:border-admin-border-dark">
          <div className="flex items-center gap-2">
            {icon && (
              <span className="text-primary-600 dark:text-primary-400">{icon}</span>
            )}
            {title && (
              <h3 className="font-semibold text-gray-900 dark:text-admin-text-dark">
                {title}
              </h3>
            )}
          </div>
          {action}
        </div>
      )}
      <div className={paddingClasses[padding]}>{children}</div>
    </div>
  );
}
