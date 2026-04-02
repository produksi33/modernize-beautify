import { useState, useEffect } from "react";
import { Database, Search } from "lucide-react";
import { SectionHeader } from "../SectionHeader";
import { LoadingSpinner } from "../LoadingSpinner";
import { fetchDatabasePetani, formatNIK } from "@/lib/api";

export function DatabasePetaniSection() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchDatabasePetani()
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const filtered = data.filter(row =>
    !search ||
    (row.kode_subsegmen || "").toLowerCase().includes(search.toLowerCase()) ||
    (row["Nama Kepala Keluarga"] || "").toLowerCase().includes(search.toLowerCase()) ||
    (row["Nama Pengelola UTP"] || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-slide-up">
      <SectionHeader icon={Database} title="Database Petani" description="Data lengkap database petani." />
      <div className="dashboard-card">
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            className="search-input pl-10"
            placeholder="Cari Kode Subsegmen atau Nama..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading && <LoadingSpinner />}
        {error && <div className="rounded-lg bg-destructive/10 border border-destructive/20 text-destructive p-4 text-sm">{error}</div>}

        {!loading && (
          <div className="overflow-auto max-h-[500px] rounded-lg border border-border">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Kode Subsegmen</th>
                  <th>Nama Kepala Keluarga</th>
                  <th>NIK Kepala Keluarga</th>
                  <th>Alamat</th>
                  <th>Nama Pengelola UTP</th>
                  <th>NIK Pengelola</th>
                  <th>No HP</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Data tidak ditemukan</td></tr>
                ) : (
                  filtered.map((row, i) => (
                    <tr key={i}>
                      <td className="font-medium">{row.kode_subsegmen || ""}</td>
                      <td>{row["Nama Kepala Keluarga"] || ""}</td>
                      <td>{formatNIK(row["NIK Kepala Keluarga"])}</td>
                      <td>{row.Alamat || ""}</td>
                      <td>{row["Nama Pengelola UTP"] || ""}</td>
                      <td>{formatNIK(row["NIK Nama Pengelola UTP"])}</td>
                      <td>{row["No HP"] || ""}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
