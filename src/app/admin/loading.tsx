import Image from 'next/image';
import styles from './admin.module.css';

export default function AdminLoading() {
  return (
    <div className={styles.page}>
      <div className={styles.headerBar}>
        <div className={styles.header}>
          <div className={styles.brand}>
            <Image src="/images/logo.jpg" alt="DRINK IT" width={44} height={44} className={styles.logo} />
            <div>
              <h1 className={styles.title}>Orders Dashboard</h1>
              <p className={styles.subtitle}>Track and complete customer orders</p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.statsGrid}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div className={styles.statCard} key={i}>
              <div className={`${styles.skeleton} ${styles.skeletonLabel}`} />
              <div className={`${styles.skeleton} ${styles.skeletonValue}`} />
            </div>
          ))}
        </div>

        <div className={styles.orderGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div className={styles.orderCard} key={i}>
              <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: '60%' }} />
              <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: '80%', marginTop: 14 }} />
              <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: '40%', marginTop: 14 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
