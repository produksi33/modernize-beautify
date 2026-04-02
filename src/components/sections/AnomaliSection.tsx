import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Download, Filter } from "lucide-react";
import { SectionHeader } from "../SectionHeader";
import { LoadingSpinner } from "../LoadingSpinner";
import { fetchSheetList, fetchSheetData, warningText } from "@/lib/api";
import * as XLSX from "xlsx";

export function AnomaliSection() {
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [header, setHeader] = useState<string[]>([]);
  const [data, setData] = useState<any[][]>([]);
  const [allData, setAllData] = useState<any[][]>([]);
  const [description, setDescription] = useState("Halaman untuk menampilkan data anomali dari Google Sheets.");
  const [filterKab, setFilterKab] = useState("");
  const [filterSubround, setFilterSubround] = useState("");
  const [kabOptions, setKabOptions] = useState<string[]>([]);
  const [subroundOptions, setSubroundOptions] = useState<string[]>([]);

  useEffect(() => {
    fetchSheetList().then(setSheets).catch(e => setError(e.message));
  }, []);

  const loadData = useCallback(async (sheet: string) => {
    if (!sheet) {
      setHeader([]);
      setData([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await fetchSheetData(sheet);
      setHeader(result.header);

      const key = sheet.toLowerCase().replace(/\s+/g, "");
      setDescription(warningText[key] ? `Keterangan: ${warningText[key]}` : "Halaman untuk menampilkan data anomali dari Google Sheets.");

      // Filter by flag_1 for R sheets
      const match = sheet.match(/^R(\d+)/);
      let filtered = result.data;
      if (match) {
        const num = parseInt(match[1]);
        if (num >= 108 && num <= 901) {
          const flagIdx = result.header.findIndex((h: string) => h.toLowerCase() === "flag_1");
          if (flagIdx !== -1) filtered = result.data.filter((row: any[]) => row[flagIdx] == 1);
        }
      }

      setAllData(filtered);
      setData(filtered);

      // Populate filters
      const kabSet = new Set<string>();
      const subSet = new Set<string>();
      filtered.forEach((row: any[]) => {
        if (row[1]) kabSet.add(String(row[1]));
        if (row[6]) subSet.add(String(row[6]));
      });
      setKabOptions([...kabSet].sort());
      setSubroundOptions([...subSet].sort());
      setFilterKab("");
      setFilterSubround("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let filtered = allData;
    if (filterKab) filtered = filtered.filter(row => String(row[1]) === filterKab);
    if (filterSubround) filtered = filtered.filter(row => String(row[6]) === filterSubround);
    setData(filtered);
  }, [filterKab, filterSubround, allData]);

  const isRSheet = selectedSheet.match(/^R(\d+)/) !== null;

  const downloadExcel = () => {
    if (data.length === 0) return;
    const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Anomali");
    XLSX.writeFile(wb, `${selectedSheet || "Data"}_anomali.xlsx`);
  };

  const handleCheckbox = (rowIndex: number, type: string, checked: boolean) => {
    const key = `${selectedSheet}_${rowIndex}`;
    const saved = JSON.parse(localStorage.getItem(key) || "{}");
    saved[type] = checked;
    localStorage.setItem(key, JSON.stringify(saved));
  };

  return (
    <div className="animate-slide-up">
      <SectionHeader icon={AlertTriangle} title="Anomali" description={description} />

      <div className="dashboard-card">
        {/* Sheet selector */}
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

        {/* Filters */}
        {kabOptions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                <Filter className="w-3.5 h-3.5 inline mr-1" />Filter Kabupaten/Kota:
              </label>
              <select className="filter-select" value={filterKab} onChange={e => setFilterKab(e.target.value)}>
                <option value="">-- Semua Kabupaten/Kota --</option>
                {kabOptions.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                <Filter className="w-3.5 h-3.5 inline mr-1" />Filter Subround:
              </label>
              <select className="filter-select" value={filterSubround} onChange={e => setFilterSubround(e.target.value)}>
                <option value="">-- Semua Subround --</option>
                {subroundOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Download button */}
        {data.length > 0 && (
          <div className="flex justify-end mb-4">
            <button onClick={downloadExcel} className="btn-primary">
              <Download className="w-4 h-4" /> Unduh Excel
            </button>
          </div>
        )}

        {loading && <LoadingSpinner />}

        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 text-destructive p-4 text-sm">
            {error}
          </div>
        )}

        {/* Table */}
        {!loading && header.length > 0 && (
          <div className="overflow-auto max-h-[500px] rounded-lg border border-border">
            <table className="table-modern">
              <thead>
                <tr>
                  {header.map((h, i) => <th key={i}>{h || `Kolom ${i + 1}`}</th>)}
                  {isRSheet && (
                    <>
                      <th className="text-center">Sesuai Lapangan</th>
                      <th className="text-center">Butuh Perbaikan</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr><td colSpan={header.length + (isRSheet ? 2 : 0)} className="text-center py-8 text-muted-foreground">Tidak ada data</td></tr>
                ) : (
                  data.map((row, ri) => {
                    const saved = JSON.parse(localStorage.getItem(`${selectedSheet}_${ri}`) || "{}");
                    return (
                      <tr key={ri}>
                        {row.map((cell: any, ci: number) => <td key={ci}>{cell ?? ""}</td>)}
                        {isRSheet && (
                          <>
                            <td className="text-center">
                              <input type="checkbox" defaultChecked={saved.sesuai} onChange={e => handleCheckbox(ri, "sesuai", e.target.checked)} className="w-4 h-4 accent-primary" />
                            </td>
                            <td className="text-center">
                              <input type="checkbox" defaultChecked={saved.perbaikan} onChange={e => handleCheckbox(ri, "perbaikan", e.target.checked)} className="w-4 h-4 accent-primary" />
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && header.length === 0 && !selectedSheet && (
          <div className="text-center py-12 text-muted-foreground">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Pilih sheet untuk menampilkan data</p>
          </div>
        )}
      </div>
    </div>
  );
}
