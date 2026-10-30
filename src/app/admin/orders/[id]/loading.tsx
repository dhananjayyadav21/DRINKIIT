import Image from 'next/image';
import styles from '../../admin.module.css';

export default function OrderDetailLoading() {
  return (
    <div className={styles.page}>
      <div className={styles.headerBar}>
        <div className={styles.header}>
          <div className={styles.brand}>
            <Image src="/images/logo.jpg" alt="DRINK IT" width={44} height={44} className={styles.logo} />
            <div>
              <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
              <div className={`${styles.skeleton} ${styles.skeletonSubtitle}`} />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.detailGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div className={styles.detailCard} key={i}>
              <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: '45%', marginBottom: 18 }} />
              <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: '100%' }} />
              <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: '85%', marginTop: 12 }} />
              <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: '65%', marginTop: 12 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
