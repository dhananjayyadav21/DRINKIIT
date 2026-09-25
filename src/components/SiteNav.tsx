import Image from 'next/image';
import Link from 'next/link';
import styles from './site.module.css';

export default function SiteNav() {
  return (
    <header className={styles.nav}>
      <div className={styles.navInner}>
        <Link href="/" className={styles.brand}>
          <Image src="/images/logo.jpg" alt="DRINK iT" width={36} height={36} className={styles.brandLogo} />
          Drink iT
        </Link>
        <nav className={styles.navLinks}>
          <Link href="/">Home</Link>
          <Link href="/about">About</Link>
          <Link href="/privacy">Privacy Policy</Link>
        </nav>
      </div>
    </header>
  );
}
