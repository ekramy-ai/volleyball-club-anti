import React, { useState } from "react";
import { useAuth } from "../../src/lib/AuthContext";
import { useTranslation } from "react-i18next";

export default function Login() {
  const { t } = useTranslation();
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (isSignUp) {
      const { error } = await signUp(email, password, { full_name: fullName });
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        // Automatically switch to login after successful signup (unless email confirmation is on)
        // For Supabase, if confirmation is off, it logs them in.
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) setError(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950 px-4">
      <div className="max-w-md w-full space-y-8 bg-gray-900 p-8 rounded-2xl border border-gray-800 shadow-2xl">
        <div className="text-center">
          <img src="/logo-x.png" alt="XURA" className="h-16 mx-auto mb-4" />
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            <span className="text-red-500">X</span>URA SYSTEM
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            {isSignUp 
              ? t("auth_signup_subtitle", "Create your professional coach account")
              : t("auth_login_subtitle", "Sign in to your coaching dashboard")
            }
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {t("players_full_name", "Full Name")}
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none"
                  placeholder="Coach Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                {t("auth_email", "Email Address")}
              </label>
              <input
                type="email"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none"
                placeholder="coach@xura.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                {t("auth_password", "Password")}
              </label>
              <input
                type="password"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-900/50 text-red-400 text-xs p-3 rounded-lg">
              {error}
            </div>
          )}

          {success && isSignUp && (
            <div className="bg-green-900/20 border border-green-900/50 text-green-400 text-xs p-3 rounded-lg">
              {t("auth_signup_success", "Account created successfully! You can now sign in.")}
            </div>
          )}

          <div className="space-y-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading 
                ? t("common_loading", "Loading...") 
                : (isSignUp ? t("auth_create_account", "Create Account") : t("auth_sign_in", "Sign In"))
              }
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setError(null); setSuccess(false); }}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                {isSignUp 
                  ? t("auth_already_have_account", "Already have an account? Sign In")
                  : t("auth_dont_have_account", "Don't have an account? Sign Up")
                }
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
