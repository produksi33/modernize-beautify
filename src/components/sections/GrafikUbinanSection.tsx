import { useState, useEffect } from "react";
import { TrendingUp } from "lucide-react";
import { SectionHeader } from "../SectionHeader";
import { LoadingSpinner } from "../LoadingSpinner";
import { fetchGrafikKabupaten } from "@/lib/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

export function GrafikUbinanSection() {
  const [data, setData] = useState<any[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchGrafikKabupaten()
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const chartData = data[selectedIdx]
    ? months.map((m, i) => ({
        name: m,
        Target: data[selectedIdx].garis1?.[i] ?? null,
        Cadangan: data[selectedIdx].garis2?.[i] ?? null,
        Realisasi: data[selectedIdx].garis3?.[i] ?? null,
      }))
    : [];

  return (
    <div className="animate-slide-up">
      <SectionHeader icon={TrendingUp} title="Grafik Hasil Ubinan" description="Grafik interaktif berdasarkan kabupaten dari data bulanan." />
      <div className="dashboard-card">
        <div className="mb-5">
          <label className="block text-sm font-semibold text-foreground mb-2">Pilih Kabupaten:</label>
          <select
            className="filter-select max-w-md"
            value={selectedIdx}
            onChange={e => setSelectedIdx(Number(e.target.value))}
          >
            {data.map((d, i) => <option key={i} value={i}>{d.kab}</option>)}
          </select>
        </div>

        {loading && <LoadingSpinner text="Memuat grafik..." />}
        {error && <div className="rounded-lg bg-destructive/10 border border-destructive/20 text-destructive p-4 text-sm">{error}</div>}

        {!loading && chartData.length > 0 && (
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(140 20% 90%)" />
                <XAxis dataKey="name" tick={{ fill: "hsl(150 10% 45%)", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(150 10% 45%)", fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(0 0% 100%)", border: "1px solid hsl(140 20% 90%)", borderRadius: 8 }} />
                <Legend />
                <Line type="monotone" dataKey="Target" stroke="hsl(220 70% 50%)" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Cadangan" stroke="hsl(38 90% 50%)" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Realisasi" stroke="hsl(142 55% 45%)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
