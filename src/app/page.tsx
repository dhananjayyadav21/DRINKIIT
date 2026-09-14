import styles from './home.module.css';

export default function Home() {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>🥤</div>
        <div className={styles.liveBadge}>
          <span className={styles.liveDot} />
          Bot is live
        </div>
        <h1 className={styles.title}>DRINK IT WhatsApp Bot</h1>
        <p className={styles.subtitle}>
          Your ordering bot is up and taking orders on WhatsApp right now — customers can browse the
          catalog, place orders and pay, fully automated, 24/7.
        </p>
        <div className={styles.divider} />
        <p className={styles.ctaLabel}>Want to check your orders?</p>
        <a href="/admin" className={styles.ctaButton}>
          Login to track orders →
        </a>
      </div>
    </main>
  );
}
