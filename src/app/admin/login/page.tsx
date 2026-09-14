import { login } from '../actions';
import PasswordField from './PasswordField';
import styles from './login.module.css';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>🥤</div>
        <h1 className={styles.title}>DRINK IT Admin</h1>
        <p className={styles.subtitle}>Sign in to manage orders</p>

        <form action={login} className={styles.form}>
          {error && <p className={styles.error}>Invalid email or password.</p>}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              Email
            </label>
            <input id="email" name="email" type="email" placeholder="admin@example.com" required className={styles.input} />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              Password
            </label>
            <PasswordField />
          </div>

          <button type="submit" className={styles.submit}>
            Log in
          </button>
        </form>
      </div>
    </main>
  );
}
