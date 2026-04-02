import { useState } from "react";
import { FileText, Search } from "lucide-react";
import { SectionHeader } from "../SectionHeader";
import { LoadingSpinner } from "../LoadingSpinner";
import { fetchHasilUbinan, analisisSR } from "@/lib/api";

const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agst","Sept","Okt","Nov","Des"];

export function HasilUbinanSection() {
  const [selectedSheet, setSelectedSheet] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tableData, setTableData] = useState<any[]>([]);
  const [mode, setMode] = useState<"sr" | "bulan" | "">("");
  const [search, setSearch] = useState("");

  const loadData = async (sheet: string) => {
    if (!sheet) return;
    setLoading(true);
    setError("");
    try {
      const result = await fetchHasilUbinan(sheet);
      setTableData(result.data.slice(3));
      setMode(sheet === "Tab Bulan" ? "bulan" : "sr");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = tableData.filter(row => {
    if (!search) return true;
    const kode = mode === "bulan" ? String(row[1] || "") : String(row[3] || "");
    return kode.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="animate-slide-up">
      <SectionHeader icon={FileText} title="Hasil Ubinan" description="Data hasil ubinan per subround dan bulanan." />
      <div className="dashboard-card">
        <div className="mb-5">
          <label className="block text-sm font-semibold text-foreground mb-2">Pilih Sheet:</label>
          <select
            className="filter-select max-w-md"
            value={selectedSheet}
            onChange={e => { setSelectedSheet(e.target.value); loadData(e.target.value); }}
          >
            <option value="">-- Pilih Sheet --</option>
            <option value="Tab SR">Tab SR (Subround)</option>
            <option value="Tab Bulan">Tab Bulan (Bulanan)</option>
          </select>
        </div>

        {tableData.length > 0 && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              className="search-input pl-10"
              placeholder="Search Kode Subsegmen (contoh: 3301)"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        )}

        {loading && <LoadingSpinner />}
        {error && <div className="rounded-lg bg-destructive/10 border border-destructive/20 text-destructive p-4 text-sm">{error}</div>}

        {!loading && mode === "bulan" && filteredData.length > 0 && (
          <div className="overflow-auto max-h-[500px] rounded-lg border border-border">
            <table className="table-modern text-xs">
              <thead>
                <tr>
                  <th rowSpan={2} className="!bg-primary">Kode_Subsegmen</th>
                  <th colSpan={12} style={{ background: "hsl(255 50% 40%)", color: "white" }}>2023</th>
                  <th colSpan={12} style={{ background: "hsl(42 90% 40%)", color: "white" }}>2024</th>
                  <th colSpan={12} style={{ background: "hsl(110 60% 30%)", color: "white" }}>2025</th>
                  <th colSpan={12} style={{ background: "hsl(220 60% 45%)", color: "white" }}>2026</th>
                  <th rowSpan={2} style={{ background: "hsl(0 0% 40%)", color: "white" }}>Analisis</th>
                  <th rowSpan={2} style={{ background: "hsl(0 0% 40%)", color: "white" }}>Justifikasi</th>
                </tr>
                <tr>
                  {[0,1,2,3].map(y => months.map((m, i) => <th key={`${y}-${i}`} className="!text-xs !px-2">{m}</th>))}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, ri) => {
                  if (!row[1]) return null;
                  return (
                    <tr key={ri}>
                      <td className="font-semibold">{row[1] ?? ""}</td>
                      {Array.from({ length: 48 }, (_, i) => (
                        <td key={i} className={row[i + 2] ? "bg-accent/30" : ""}>{row[i + 2] ?? ""}</td>
                      ))}
                      <td contentEditable className="bg-muted/30 min-w-[100px]" />
                      <td contentEditable className="bg-muted/30 min-w-[100px]" />
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && mode === "sr" && filteredData.length > 0 && (
          <div className="overflow-auto max-h-[500px] rounded-lg border border-border">
            <table className="table-modern text-xs">
              <thead>
                <tr>
                  <th rowSpan={2} className="!bg-primary">Kode_Subsegmen</th>
                  <th colSpan={3} style={{ background: "hsl(255 50% 40%)", color: "white" }}>2023</th>
                  <th colSpan={3} style={{ background: "hsl(42 90% 40%)", color: "white" }}>2024</th>
                  <th colSpan={3} style={{ background: "hsl(110 60% 30%)", color: "white" }}>2025</th>
                  <th colSpan={3} style={{ background: "hsl(220 60% 45%)", color: "white" }}>2026</th>
                  <th rowSpan={2} style={{ background: "hsl(0 0% 40%)", color: "white" }}>Analisis</th>
                  <th rowSpan={2} style={{ background: "hsl(0 0% 40%)", color: "white" }}>Justifikasi</th>
                </tr>
                <tr>
                  {[0,1,2,3].map(y => ["SR1","SR2","SR3"].map((sr, i) => <th key={`${y}-${i}`} className="!text-xs !px-1 !min-w-[45px] !max-w-[55px] text-center">{sr}</th>))}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, ri) => {
                  const kodeSub = row[3];
                  if (!kodeSub) return null;
                  const dataSR = Array.from({ length: 12 }, (_, i) => row[i + 4] ?? "");
                  const hasil = analisisSR(dataSR);
                  const colorClass = hasil.includes("Trend naik") ? "text-success font-semibold" : hasil.includes("Trend turun") ? "text-destructive font-semibold" : "text-muted-foreground";
                  return (
                    <tr key={ri}>
                      <td className="font-semibold">{kodeSub}</td>
                      {dataSR.map((val, i) => <td key={i} className="!px-1 !min-w-[45px] !max-w-[55px] text-center">{val}</td>)}
                      <td className={colorClass}>{hasil}</td>
                      <td contentEditable className="bg-muted/30 min-w-[100px]">{row[17] ?? ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && !mode && (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Pilih sheet untuk menampilkan data</p>
          </div>
        )}
      </div>
    </div>
  );
}
