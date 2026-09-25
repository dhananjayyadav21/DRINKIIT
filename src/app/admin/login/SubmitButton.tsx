'use client';

import { useFormStatus } from 'react-dom';
import styles from './login.module.css';

export default function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={styles.submit} disabled={pending} aria-busy={pending}>
      {pending ? (
        <>
          <span className={styles.spinner} aria-hidden="true" />
          Logging in…
        </>
      ) : (
        'Log in'
      )}
    </button>
  );
}
