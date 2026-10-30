import adminStyles from '../../../admin.module.css';
import styles from './invoice.module.css';

export default function InvoiceLoading() {
  return (
    <div className={styles.page}>
      <div className={styles.sheetWrap}>
        <div className={styles.sheet}>
          <div className={adminStyles.skeleton} style={{ height: 56, width: 220, marginBottom: 24 }} />
          <div className={adminStyles.skeleton} style={{ height: 14, width: '70%', marginBottom: 10 }} />
          <div className={adminStyles.skeleton} style={{ height: 14, width: '50%', marginBottom: 28 }} />
          <div className={adminStyles.skeleton} style={{ height: 120, width: '100%', marginBottom: 24 }} />
          <div className={adminStyles.skeleton} style={{ height: 160, width: '100%' }} />
        </div>
      </div>
    </div>
  );
}
