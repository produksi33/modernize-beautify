import { useState, useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import { SectionHeader } from "../SectionHeader";
import { LoadingSpinner } from "../LoadingSpinner";
import { fetchMapData } from "@/lib/api";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function colLetterToIndex(letter: string): number {
  let col = 0;
  for (let i = 0; i < letter.length; i++) {
    col = col * 26 + (letter.charCodeAt(i) - 64);
  }
  return col - 1;
}

function colIndex(header: string[], name: string): number {
  return header.findIndex(h => h.toLowerCase() === name.toLowerCase());
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function PetaSection() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapType, setMapType] = useState("streets");
  const [filterKab, setFilterKab] = useState("ALL");
  const [filterSubround, setFilterSubround] = useState("ALL");
  const [filterSubsegmen, setFilterSubsegmen] = useState("ALL");
  const [filterBulan, setFilterBulan] = useState("ALL");
  const [filterOptions, setFilterOptions] = useState<{ kab: string[]; subround: string[]; subsegmen: string[]; bulan: string[] }>({ kab: [], subround: [], subsegmen: [], bulan: [] });

  const dataRef = useRef<{ alokasi: any; realisasi: any; headerAlokasi: string[]; headerRealisasi: string[]; alokasiMap: Record<string, { lat: number; lng: number }> }>({
    alokasi: [], realisasi: [], headerAlokasi: [], headerRealisasi: [], alokasiMap: {},
  });

  const streetsLayerRef = useRef<L.TileLayer | null>(null);
  const satelliteLayerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current).setView([-2.5, 118], 5);
    mapInstance.current = map;

    streetsLayerRef.current = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    });
    satelliteLayerRef.current = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      attribution: "Tiles &copy; Esri",
    });
    streetsLayerRef.current.addTo(map);

    fetchMapData().then(({ alokasi, realisasi }) => {
      const hA = [...alokasi.header];
      const hR = [...realisasi.header];
      const dA = [...alokasi.data];
      const dR = [...realisasi.data];

      // Precompute alokasi map
      const xIdx = colIndex(hA, "x");
      const yIdx = colIndex(hA, "y");
      const aaIdx = colLetterToIndex("AA");
      const alokasiMap: Record<string, { lat: number; lng: number }> = {};
      dA.forEach((row: any[]) => {
        const aa = row[aaIdx];
        if (aa) {
          const lng = parseFloat(row[xIdx]);
          const lat = parseFloat(row[yIdx]);
          if (!isNaN(lat) && !isNaN(lng)) alokasiMap[aa] = { lat, lng };
        }
      });

      dataRef.current = { alokasi: dA, realisasi: dR, headerAlokasi: hA, headerRealisasi: hR, alokasiMap };

      // Populate filters
      const kabIdx = colIndex(hA, "kab") !== -1 ? colIndex(hA, "kab") : 1;
      const subIdx = colIndex(hA, "subround");
      const ssIdx = colIndex(hA, "subsegmen");
      const bIdx = colIndex(hA, "bulan");

      const sets = { kab: new Set<string>(), subround: new Set<string>(), subsegmen: new Set<string>(), bulan: new Set<string>() };
      dA.forEach((row: any[]) => {
        if (row[kabIdx]) sets.kab.add(String(row[kabIdx]));
        if (subIdx !== -1 && row[subIdx]) sets.subround.add(String(row[subIdx]));
        if (ssIdx !== -1 && row[ssIdx]) sets.subsegmen.add(String(row[ssIdx]));
        if (bIdx !== -1 && row[bIdx]) sets.bulan.add(String(row[bIdx]));
      });

      setFilterOptions({
        kab: [...sets.kab].sort(),
        subround: [...sets.subround].sort(),
        subsegmen: [...sets.subsegmen].sort(),
        bulan: [...sets.bulan].sort(),
      });
      setLoading(false);
    }).catch(err => {
      console.error("Error loading map data:", err);
      setLoading(false);
    });

    return () => { map.remove(); mapInstance.current = null; };
  }, []);

  // Update markers on filter change
  useEffect(() => {
    if (!mapInstance.current || loading) return;
    const map = mapInstance.current;
    const { alokasi, realisasi, headerAlokasi, headerRealisasi, alokasiMap } = dataRef.current;

    // Clear
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    const normalizeKab = (val: any) => val ? String(val).trim().replace(/^0+/, "") : "";
    const passFilter = (row: any[], header: string[]) => {
      const kabIdx = colIndex(header, "kab") !== -1 ? colIndex(header, "kab") : 1;
      const subIdx = colIndex(header, "subround");
      const ssIdx = colIndex(header, "subsegmen");
      const bIdx = colIndex(header, "bulan");
      if (filterKab !== "ALL" && normalizeKab(row[kabIdx]) !== normalizeKab(filterKab)) return false;
      if (filterSubround !== "ALL" && subIdx !== -1 && row[subIdx] != filterSubround) return false;
      if (filterSubsegmen !== "ALL" && ssIdx !== -1 && row[ssIdx] != filterSubsegmen) return false;
      if (filterBulan !== "ALL" && bIdx !== -1 && row[bIdx] != filterBulan) return false;
      return true;
    };

    // Alokasi markers
    const xIdx = colIndex(headerAlokasi, "x");
    const yIdx = colIndex(headerAlokasi, "y");
    alokasi.forEach((row: any[]) => {
      if (!passFilter(row, headerAlokasi)) return;
      const lng = parseFloat(row[xIdx]);
      const lat = parseFloat(row[yIdx]);
      if (isNaN(lat) || isNaN(lng)) return;
      const color = row[1] === "U" ? "blue" : row[1] === "C" ? "black" : "blue";
      const cols = ["H", "I", "J", "M", "AA"].map(colLetterToIndex);
      const popupData = cols.map(i => row[i]).filter(v => v);
      const popup = popupData.join("<br>") + `<hr><b>Koordinat:</b> ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      const marker = L.circleMarker([lat, lng], { color, fillColor: color, fillOpacity: 0.85, radius: 5 }).addTo(map);
      marker.bindPopup(popup);
      markersRef.current.push(marker);
    });

    // Realisasi markers
    const aqIdx = colIndex(headerRealisasi, "aq") !== -1 ? colIndex(headerRealisasi, "aq") : 42;
    const arIdx = colIndex(headerRealisasi, "ar") !== -1 ? colIndex(headerRealisasi, "ar") : 43;
    const ffIdx = colIndex(headerRealisasi, "ff") !== -1 ? colIndex(headerRealisasi, "ff") : colLetterToIndex("FF");
    const fgIdx = colIndex(headerRealisasi, "fg") !== -1 ? colIndex(headerRealisasi, "fg") : colLetterToIndex("FG");
    const fhIdx = colIndex(headerRealisasi, "fh") !== -1 ? colIndex(headerRealisasi, "fh") : colLetterToIndex("FH");
    const fjIdx = colIndex(headerRealisasi, "fj") !== -1 ? colIndex(headerRealisasi, "fj") : colLetterToIndex("FJ");
    let fkIdx = colIndex(headerRealisasi, "fk");
    if (fkIdx === -1) fkIdx = colIndex(headerRealisasi, "realisasi");
    if (fkIdx === -1) fkIdx = colLetterToIndex("FK");

    realisasi.forEach((row: any[]) => {
      if (!passFilter(row, headerRealisasi)) return;
      const lng = parseFloat(row[aqIdx]);
      const lat = parseFloat(row[arIdx]);
      if (isNaN(lat) || isNaN(lng)) return;

      const subsegmenId = row[fjIdx];
      let distanceText = "";
      if (subsegmenId && alokasiMap[subsegmenId]) {
        const dist = haversineDistance(lat, lng, alokasiMap[subsegmenId].lat, alokasiMap[subsegmenId].lng);
        distanceText = `<br><br><b>Jarak ke titik Alokasi (subsegmen ${subsegmenId}):</b> ${dist.toFixed(2)} meter`;
      }

      const fk = String(row[fkIdx] || "").toLowerCase().trim();
      const color = fk === "alokasi" ? "yellow" : fk === "tambahan" ? "red" : "gray";

      const popup = `${row[ffIdx] || ""}<br>${row[fgIdx] || ""}<br>${row[fhIdx] || ""}<br>${subsegmenId || ""}${distanceText}<hr><b>Koordinat:</b> ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      const marker = L.circleMarker([lat, lng], { color, fillColor: color, fillOpacity: 0.85, radius: 5 }).addTo(map);
      marker.bindPopup(popup);
      markersRef.current.push(marker);
    });
  }, [filterKab, filterSubround, filterSubsegmen, filterBulan, loading]);

  // Map type switch
  useEffect(() => {
    if (!mapInstance.current) return;
    const map = mapInstance.current;
    if (mapType === "satellite") {
      if (streetsLayerRef.current) map.removeLayer(streetsLayerRef.current);
      if (satelliteLayerRef.current) satelliteLayerRef.current.addTo(map);
    } else {
      if (satelliteLayerRef.current) map.removeLayer(satelliteLayerRef.current);
      if (streetsLayerRef.current) streetsLayerRef.current.addTo(map);
    }
  }, [mapType]);

  return (
    <div className="animate-slide-up">
      <SectionHeader icon={MapPin} title="Peta" description="Peta interaktif titik alokasi dan realisasi." />
      <div className="dashboard-card">
        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Kabupaten:</label>
            <select className="filter-select" value={filterKab} onChange={e => setFilterKab(e.target.value)}>
              <option value="ALL">Semua</option>
              {filterOptions.kab.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Subround:</label>
            <select className="filter-select" value={filterSubround} onChange={e => setFilterSubround(e.target.value)}>
              <option value="ALL">Semua</option>
              {filterOptions.subround.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Subsegmen:</label>
            <select className="filter-select" value={filterSubsegmen} onChange={e => setFilterSubsegmen(e.target.value)}>
              <option value="ALL">Semua</option>
              {filterOptions.subsegmen.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Bulan:</label>
            <select className="filter-select" value={filterBulan} onChange={e => setFilterBulan(e.target.value)}>
              <option value="ALL">Semua</option>
              {filterOptions.bulan.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Tipe Peta:</label>
            <select className="filter-select" value={mapType} onChange={e => setMapType(e.target.value)}>
              <option value="streets">Jalan</option>
              <option value="satellite">Satelit</option>
            </select>
          </div>
        </div>

        {loading && <LoadingSpinner text="Memuat data peta..." />}

        {/* Map */}
        <div ref={mapRef} className="w-full h-[500px] rounded-xl border border-border" />

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-foreground">
          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: "blue" }} /> Utama (Alokasi)</span>
          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: "black" }} /> Cadangan (Alokasi)</span>
          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: "yellow", border: "1px solid #ccc" }} /> Alokasi (Realisasi)</span>
          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: "red" }} /> Tambahan (Realisasi)</span>
        </div>
      </div>
    </div>
  );
}
