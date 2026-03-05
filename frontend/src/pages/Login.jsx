import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const Login = () => {
  const navigate  = useNavigate();
  const { login, register } = useAuth();

  const [mode,      setMode]      = useState("login"); // "login" | "register"
  const [showPass,  setShowPass]  = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState("");

  const [form, setForm] = useState({
    name: "", email: "", password: "",
  });

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (mode === "login") {
        await login(form.email, form.password);
        toast.success("Welcome back! 👋");
      } else {
        await register(form);
        toast.success("Account created successfully! 🎉");
      }
      navigate("/");
    } catch (err) {
      const msg = err.response?.data?.message || "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900
                    flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #6366f1 0%, transparent 50%),
                            radial-gradient(circle at 75% 75%, #8b5cf6 0%, transparent 50%)`,
        }}
      />

      <div className="relative w-full max-w-md animate-fadeInUp">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center
                            mx-auto mb-4">
              <Briefcase className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Mini CRM</h1>
            <p className="text-indigo-200 text-sm mt-1">Lead Management System</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            {["login", "register"].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-3.5 text-sm font-semibold transition-colors capitalize
                  ${mode === m
                    ? "text-indigo-600 border-b-2 border-indigo-600"
                    : "text-slate-400 hover:text-slate-600"}`}
              >
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-7 space-y-4">
            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 bg-red-50 text-red-700 px-4 py-3
                              rounded-xl border border-red-100 text-sm animate-fadeIn">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Name (register only) */}
            {mode === "register" && (
              <div className="animate-fadeIn">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="John Doe"
                  className="input-field"
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="admin@company.com"
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPass ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="Min. 6 characters"
                  className="input-field pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400
                             hover:text-slate-600 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary justify-center py-3 mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {mode === "login" ? "Signing in..." : "Creating account..."}
                </>
              ) : (
                mode === "login" ? "Sign In" : "Create Account"
              )}
            </button>

            {/* Demo credentials hint */}
            {mode === "login" && (
              <p className="text-center text-xs text-slate-400 pt-1">
                First time?{" "}
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className="text-indigo-600 font-medium hover:underline"
                >
                  Create an admin account
                </button>
              </p>
            )}
          </form>
        </div>

        <p className="text-center text-slate-400 text-xs mt-6">
          Mini CRM © {new Date().getFullYear()} · Built with React + Node.js
        </p>
      </div>
    </div>
  );
};

export default Login;