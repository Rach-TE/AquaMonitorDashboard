import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import "./LoginPage.css";

function friendlyError(code) {
  if (code === "auth/operation-not-allowed") {
    return "Operator login is not enabled in this Firebase project yet. The project owner must enable Email/Password sign-in in Firebase Console > Authentication > Sign-in method, and create the Operator account there.";
  }
  if (code === "auth/invalid-credential" || code === "auth/user-not-found" || code === "auth/wrong-password") {
    return "Email or password is incorrect. Check for capitals or spaces and try again.";
  }
  if (code === "auth/invalid-email") {
    return "That email address does not look right. Check it and try again.";
  }
  if (code === "auth/too-many-requests") {
    return "Too many attempts. Wait a few minutes and try again.";
  }
  if (code === "auth/network-request-failed") {
    return "No network connection. Check your connection and try again.";
  }
  return "Login failed. Check your email and password and try again.";
}

function LoginPage({ onBack, onLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      onLoggedIn(result.user);
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">≈</div>
        <h2>AquaMonitor</h2>
        <p className="login-kicker">OPERATOR LOGIN</p>
        <p className="login-note">
          Authorised personnel only. Visitors do not need to log in —
          use Continue as Visitor from the landing page to view readings read-only.
        </p>
        <form onSubmit={submit}>
          <label>
            EMAIL
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            PASSWORD
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Log in as Operator"}
          </button>
        </form>
        <button type="button" className="login-back" onClick={onBack}>
          ← Back to landing page
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
