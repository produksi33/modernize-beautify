import { Info, CheckCircle } from "lucide-react";
import { SectionHeader } from "../SectionHeader";

export function PetunjukTeknisSection() {
  const steps = [
    { title: "Navigasi Menu", desc: "Klik menu di sidebar untuk berpindah antar bagian dashboard." },
    { title: "Lihat Data", desc: "Pilih sheet dari dropdown untuk menampilkan data di setiap bagian." },
    { title: "Gunakan Filter", desc: "Manfaatkan filter untuk mempersempit data yang ditampilkan." },
    { title: "Download Data", desc: "Gunakan tombol Unduh Excel untuk mengexport data anomali." },
    { title: "Peta Interaktif", desc: "Klik marker pada peta untuk melihat detail titik lokasi." },
  ];

  return (
    <div className="animate-slide-up">
      <SectionHeader icon={Info} title="Petunjuk Teknis" description="Panduan penggunaan dashboard." />
      <div className="dashboard-card">
        <h3 className="text-lg font-bold text-foreground mb-6">Cara Menggunakan Dashboard:</h3>
        <div className="space-y-4">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-4 items-start p-4 rounded-xl bg-accent/30 border border-border">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary-foreground">{i + 1}</span>
              </div>
              <div>
                <h4 className="font-semibold text-foreground">{step.title}</h4>
                <p className="text-sm text-muted-foreground mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 rounded-xl bg-accent/50 border border-primary/20">
          <div className="flex items-center gap-2 text-primary font-semibold mb-2">
            <CheckCircle className="w-5 h-5" />
            Tips
          </div>
          <p className="text-sm text-muted-foreground">
            Untuk pengalaman terbaik, gunakan browser Chrome atau Firefox versi terbaru dengan koneksi internet yang stabil.
          </p>
        </div>
      </div>
    </div>
  );
}
