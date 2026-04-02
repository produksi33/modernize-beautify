import { useState } from "react";
import { Leaf, Lock, User } from "lucide-react";

const VALID_USERS = [
  "3300",
  ...Array.from({ length: 29 }, (_, i) => String(3301 + i)),
  ...Array.from({ length: 6 }, (_, i) => String(3371 + i)),
];

interface LoginProps {
  onLogin: (user: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!VALID_USERS.includes(username)) {
      setError("Username tidak ditemukan");
      return;
    }
    if (password !== username) {
      setError("Password salah");
      return;
    }
    localStorage.setItem("auth_user", username);
    onLogin(username);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm mb-4">
            <Leaf className="w-8 h-8 text-emerald-300" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Daun Padi</h1>
          <p className="text-emerald-200/70 mt-1 text-sm">Dashboard Monitoring Ubinan</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl space-y-5"
        >
          <div>
            <label className="block text-sm font-medium text-emerald-100 mb-1.5">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-300/60" />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Masukkan kode wilayah"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-emerald-100 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-300/60" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-300 bg-red-500/20 border border-red-400/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-400/40"
          >
            Masuk
          </button>
        </form>
      </div>
    </div>
  );
}
