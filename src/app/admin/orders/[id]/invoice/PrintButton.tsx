'use client';

import styles from './invoice.module.css';

export default function PrintButton() {
  return (
    <div className={styles.toolbar}>
      <button type="button" className={styles.printButton} onClick={() => window.print()}>
        <svg viewBox="0 0 20 20" className={styles.printIcon} fill="none" aria-hidden="true">
          <path
            d="M5.5 7.5V3.5h9v4M5.5 15.5h-2a1.5 1.5 0 0 1-1.5-1.5v-4a1.5 1.5 0 0 1 1.5-1.5h13a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1-1.5 1.5h-2M5.5 12h9v4.5h-9V12Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Print / Save as PDF
      </button>
    </div>
  );
}
