import { useState, useEffect } from "react";
import { BarChart3 } from "lucide-react";
import { SectionHeader } from "../SectionHeader";
import { LoadingSpinner } from "../LoadingSpinner";
import { fetchSheetList, fetchSheetData } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export function GrafikSection() {
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchSheetList().then(list => {
      setSheets(list.filter(s => /^R\d+/i.test(s)));
    }).catch(e => setError(e.message));
  }, []);

  const loadData = async (sheet: string) => {
    if (!sheet) { setChartData([]); return; }
    setLoading(true);
    setError("");
    try {
      const result = await fetchSheetData(sheet);
      const kabIdx = result.header.findIndex((h: string) =>
        h.toLowerCase().includes("kab") || h.toLowerCase().includes("kota")
      );
      const flagIdx = result.header.findIndex((h: string) => h.toLowerCase() === "flag_1");
      let filtered = result.data;
      if (flagIdx !== -1) filtered = filtered.filter((row: any[]) => row[flagIdx] == 1);

      const counts: Record<string, number> = {};
      filtered.forEach((row: any[]) => {
        const kab = kabIdx !== -1 ? String(row[kabIdx]) : "Unknown";
        if (kab) counts[kab] = (counts[kab] || 0) + 1;
      });

      const sorted = Object.entries(counts)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([name, value]) => ({ name, value }));

      setChartData(sorted);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-slide-up">
      <SectionHeader icon={BarChart3} title="Grafik" description="Grafik data anomali berdasarkan Kabupaten/Kota." />
      <div className="dashboard-card">
        <div className="mb-5">
          <label className="block text-sm font-semibold text-foreground mb-2">Pilih Sheet:</label>
          <select
            className="filter-select max-w-md"
            value={selectedSheet}
            onChange={e => { setSelectedSheet(e.target.value); loadData(e.target.value); }}
          >
            <option value="">-- Pilih Sheet --</option>
            {sheets.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {loading && <LoadingSpinner text="Memuat data grafik..." />}
        {error && <div className="rounded-lg bg-destructive/10 border border-destructive/20 text-destructive p-4 text-sm">{error}</div>}

        {!loading && chartData.length > 0 && (
          <div className="h-[400px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(140 20% 90%)" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" fontSize={11} tick={{ fill: "hsl(150 10% 45%)" }} />
                <YAxis allowDecimals={false} tick={{ fill: "hsl(150 10% 45%)" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(0 0% 100%)",
                    border: "1px solid hsl(140 20% 90%)",
                    borderRadius: 8,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                />
                <Legend />
                <Bar dataKey="value" name="Jumlah Anomali" fill="hsl(142 55% 45%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {!loading && !error && chartData.length === 0 && !selectedSheet && (
          <div className="text-center py-12 text-muted-foreground">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Pilih sheet untuk menampilkan grafik</p>
          </div>
        )}
      </div>
    </div>
  );
}
