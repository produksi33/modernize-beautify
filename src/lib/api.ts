// API URLs
export const API_URL = "https://script.google.com/macros/s/AKfycbz5mA_cLvAEiCV2zile4fio9EkCa4nZy9aahc0wO4xAeJw5UqJGj1ctKC9ouVhBcHgkZQ/exec";
export const API_URL_MAP = "https://script.google.com/macros/s/AKfycbw1yAeI0KFwBQIjJEa8Ft0V9CAghFfN1p5jO9oH_0wn0RLn4kaEQdMjChHdcox9-LAN/exec";
export const API_URL_HASIL = "https://script.google.com/macros/s/AKfycbx7Ixf5o_k27WexiCN-8B2rGurGPxUWBkw8ro2VsGEXOHPSNONKobyWtNmN_nv3o6D6KQ/exec";
export const API_URL_PETANI = "https://script.google.com/macros/s/AKfycbyFbft8MN_uIlwPeL2K_N_HJw-ijDcoWyvYd3tkmo7ojUhiCi2YdAtA_QIxmqgfh-c1/exec";
export const API_CHART = "https://script.google.com/macros/s/AKfycby3W0prrsVWYISVRNyvLjO-D4gGYCHu8ngoFZBeRx7euFlWYJYOokuin7tnbi7m-zEd/exec";

export const warningText: Record<string, string> = {
  r108: "berisi '2. Ubinan Prakarsa/Daerah' atau '3. Ubinan Lainnya'",
  r111: "berisi '2. Padi Ladang'",
  r111_r702: "r111 '1. Padi Sawah' tapi r702 '5. Bukan Sawah atau r111 '2. Padi Ladang' tapi r702 '1. Sawah Irigasi'",
  r205_r206: "r205<17 tahun, tapi r206 '5. Akademi/D1/D2/D3 atau r205<20 tahun tapi r206 '6. Perguruan Tinggi/D4/S1/S2/S3'",
  r601_bulanmaster: "selisih pelaksanaan ubinan dan perkiraan bulan panen lebih dari 1 bulan",
  r602: "r602<70 hari atau r602>130 hari",
  r604a: "r604a>=0.2kg",
  r604c: "r604c<1 kg atau r604c>7.5kg",
  r701b: "r701b berisi 'Lainnya' namun sebenarnya masih bisa dimasukkan ke pilihan yang tersedia",
  r701c: "r701c berisi '5. Beras Lainnya'",
  r706: "berisi kurang dari 100 m2",
  r707b: "penggunaan benih per hektar di luar rentang 10-86 kg/ha",
  r708b: "penggunaan pupuk per hektar di luar rentang 150-1.000 kg/ha",
  r709: "r709a berisi '2. Tidak' atau r709c berisi '4. Lainnya'",
  r710: "r710b berisi lebih dari 3 kali",
  r801b: "r801b berisi '5. Lainnya'",
  r802b: "r802b berisi '5. Lainnya'",
  r803c: "r803c berisi 'Lainnya' namun sebenarnya masih bisa dimasukkan ke pilihan yang tersedia",
  r804c: "jika besarnya dampak lebih dari 50 persen",
  r805b: "r805b berisi '4. Lainnya' namun sebenarnya masih bisa dimasukkan ke pilihan yang tersedia",
  r805c: "jika besarnya dampak lebih dari 50 persen",
  r901: "r901 berisi '2. Ubinan Dinas' atau r901 berisi '3. Ubinan Bersama'"
};

export async function fetchSheetList(): Promise<string[]> {
  const response = await fetch(`${API_URL}?action=sheets`);
  const result = await response.json();
  let sheets: string[] = [];
  if (Array.isArray(result)) sheets = result;
  else if (result.data && Array.isArray(result.data)) sheets = result.data;
  return sheets.filter(s => s.toLowerCase() !== "raw data");
}

export async function fetchSheetData(sheetName: string): Promise<{ header: string[]; data: any[][] }> {
  const response = await fetch(`${API_URL}?action=data&sheet=${encodeURIComponent(sheetName)}`);
  const result = await response.json();
  if (result.header && result.data) return result;
  if (result.data?.header) return result.data;
  throw new Error("Format data tidak dikenali.");
}

export async function fetchHasilUbinan(sheetName: string): Promise<{ data: any[][] }> {
  const response = await fetch(`${API_URL_HASIL}?action=data&sheet=${encodeURIComponent(sheetName)}`);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const result = await response.json();
  if (!result.data || result.data.length === 0) throw new Error("Data tidak ditemukan");
  return result;
}

export async function fetchDatabasePetani(): Promise<any[]> {
  const response = await fetch(API_URL_PETANI);
  return response.json();
}

export async function fetchGrafikKabupaten(): Promise<any[]> {
  const response = await fetch(API_CHART);
  return response.json();
}

export async function fetchMapData() {
  const [resAlokasi, resRealisasi] = await Promise.all([
    fetch(`${API_URL_MAP}?action=data&sheet=Alokasi`).then(r => r.json()),
    fetch(`${API_URL_MAP}?action=data&sheet=Realisasi`).then(r => r.json()),
  ]);
  return { alokasi: resAlokasi, realisasi: resRealisasi };
}

export function formatNIK(nik: any): string {
  if (!nik) return "";
  const strNik = String(nik).trim();
  if (strNik.length < 6) return strNik;
  return strNik.slice(0, -6) + "******";
}

export function analisisSR(dataSR: (string | number)[]): string {
  const valid = dataSR.map(v => parseFloat(String(v))).filter(v => !isNaN(v));
  if (valid.length < 2) return "-";
  const hasil: string[] = [];
  for (let i = 1; i < valid.length; i++) {
    if (valid[i] > valid[i - 1]) hasil.push("Naik");
    else if (valid[i] < valid[i - 1]) hasil.push("Turun");
    else hasil.push("Stabil");
  }
  const trend = valid[valid.length - 1] - valid[0];
  const trendText = trend > 0 ? "Trend naik" : trend < 0 ? "Trend turun" : "Trend stabil";
  return hasil.join(" → ") + " (" + trendText + ")";
}
