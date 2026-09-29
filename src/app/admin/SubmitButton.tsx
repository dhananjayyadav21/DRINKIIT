'use client';

import { useFormStatus } from 'react-dom';
import styles from './admin.module.css';

export default function SubmitButton({
  children,
  pendingLabel,
  className,
  light,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  className: string;
  light?: boolean;
}) {
  const { pending } = useFormStatus();
  const spinnerClass = light ? `${styles.spinner} ${styles.spinnerLight}` : styles.spinner;

  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending ? (
        <>
          <span className={spinnerClass} aria-hidden="true" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
