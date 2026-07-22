import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <div className="auth-root" style={{ placeContent: "center", minHeight: "100vh" }}>
      <div
        className="auth-content"
        style={{ maxWidth: 420, margin: "0 auto", textAlign: "center" }}
      >
        <h1 style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>
          Sign-in could not be completed
        </h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
          The authorization link may have expired or was already used. Try signing
          in again.
        </p>
        <Link href="/login" className="auth-submit-btn" style={{ display: "inline-block" }}>
          Back to login
        </Link>
      </div>
    </div>
  );
}
