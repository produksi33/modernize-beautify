import { useEffect, useMemo, useState } from "react";
import { Newspaper, ExternalLink, Calendar, RefreshCw, Search } from "lucide-react";
import { SectionHeader } from "../SectionHeader";
import { LoadingSpinner } from "../LoadingSpinner";

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  topic: string;
}

const TOPICS = [
  "Tanam Padi",
  "Panen Padi",
  "Hama Padi",
  "Kekeringan",
  "Gagal Panen",
  "Subsidi Pupuk",
  "Ketahanan Pangan",
];

const REGION = "Jawa Tengah";

const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

// Bing News RSS — memberikan link langsung ke situs aslinya
function buildBingNewsRSS(topic: string) {
  const q = encodeURIComponent(`${topic} ${REGION}`);
  return `https://www.bing.com/news/search?q=${q}&format=rss&cc=id&setlang=id`;
}

// Google News RSS — fallback (linknya redirect)
function buildGoogleNewsRSS(topic: string) {
  const q = encodeURIComponent(`${topic} ${REGION}`);
  return `https://news.google.com/rss/search?q=${q}+when:1y&hl=id&gl=ID&ceid=ID:id`;
}

function buildProxyURL(rssUrl: string) {
  return `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&count=30`;
}

// Extract real publisher URL from Google News redirect link by decoding base64 segment
function unwrapGoogleNewsLink(link: string): string {
  try {
    const url = new URL(link);
    if (!url.hostname.includes("news.google.com")) return link;
    // Pattern: /rss/articles/<base64>?... — base64 sometimes contains the original URL
    const match = url.pathname.match(/\/articles\/([^?\/]+)/);
    if (match) {
      const decoded = atob(match[1].replace(/-/g, "+").replace(/_/g, "/") + "==");
      const urlMatch = decoded.match(/https?:\/\/[^\s\x00-\x1f"'<>]+/);
      if (urlMatch) return urlMatch[0];
    }
  } catch {
    // ignore
  }
  return link;
}

function decodeHTML(str: string) {
  const txt = document.createElement("textarea");
  txt.innerHTML = str;
  return txt.value;
}

function extractSource(title: string, fallback: string): { title: string; source: string } {
  // Google News titles often end with " - Source Name"
  const idx = title.lastIndexOf(" - ");
  if (idx > 0 && idx > title.length - 60) {
    return { title: title.slice(0, idx).trim(), source: title.slice(idx + 3).trim() };
  }
  return { title, source: fallback || "Google News" };
}

export function FenomenaSection() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>("all"); // YYYY-MM
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [search, setSearch] = useState("");

  const loadNews = async () => {
    setLoading(true);
    setError("");
    try {
      const results = await Promise.allSettled(
        TOPICS.map(async (topic) => {
          const rss = buildGoogleNewsRSS(topic);
          const res = await fetch(buildProxyURL(rss));
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          if (json.status !== "ok" || !Array.isArray(json.items)) return [];
          return json.items.map((it: any): NewsItem => {
            const { title, source } = extractSource(decodeHTML(it.title || ""), it.author || "");
            return {
              title,
              link: it.link,
              pubDate: it.pubDate,
              source,
              topic,
            };
          });
        })
      );

      const flat: NewsItem[] = [];
      const seen = new Set<string>();
      results.forEach((r) => {
        if (r.status === "fulfilled") {
          r.value.forEach((n: NewsItem) => {
            if (!seen.has(n.link)) {
              seen.add(n.link);
              flat.push(n);
            }
          });
        }
      });

      flat.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
      setItems(flat);
      if (flat.length === 0) setError("Tidak ada berita ditemukan. Coba refresh.");
    } catch (e: any) {
      setError(e.message || "Gagal memuat berita");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  // Group by month
  const grouped = useMemo(() => {
    const filtered = items.filter((n) => {
      if (selectedTopic !== "all" && n.topic !== selectedTopic) return false;
      if (search && !n.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (selectedMonth !== "all") {
        const d = new Date(n.pubDate);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (key !== selectedMonth) return false;
      }
      return true;
    });

    const map = new Map<string, NewsItem[]>();
    filtered.forEach((n) => {
      const d = new Date(n.pubDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(n);
    });

    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [items, selectedMonth, selectedTopic, search]);

  // Available months for filter
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    items.forEach((n) => {
      const d = new Date(n.pubDate);
      set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [items]);

  const formatMonthLabel = (key: string) => {
    const [y, m] = key.split("-");
    return `${MONTHS_ID[parseInt(m, 10) - 1]} ${y}`;
  };

  const topicColor = (topic: string) => {
    const map: Record<string, string> = {
      "Tanam Padi": "bg-emerald-100 text-emerald-700 border-emerald-200",
      "Panen Padi": "bg-amber-100 text-amber-700 border-amber-200",
      "Hama Padi": "bg-rose-100 text-rose-700 border-rose-200",
      "Kekeringan": "bg-orange-100 text-orange-700 border-orange-200",
      "Gagal Panen": "bg-red-100 text-red-700 border-red-200",
      "Subsidi Pupuk": "bg-blue-100 text-blue-700 border-blue-200",
      "Ketahanan Pangan": "bg-purple-100 text-purple-700 border-purple-200",
    };
    return map[topic] || "bg-muted text-muted-foreground border-border";
  };

  return (
    <div className="animate-slide-up">
      <SectionHeader
        icon={Newspaper}
        title="Fenomena"
        description={`Berita pertanian padi & pangan wilayah ${REGION}, dikelompokkan per bulan.`}
      />

      <div className="dashboard-card">
        {/* Filters */}
        <div className="grid gap-3 md:grid-cols-4 mb-5">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Bulan</label>
            <select
              className="filter-select w-full"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="all">Semua Bulan</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>{formatMonthLabel(m)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Topik</label>
            <select
              className="filter-select w-full"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
            >
              <option value="all">Semua Topik</option>
              {TOPICS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1">
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Cari Judul</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                className="search-input pl-10 w-full"
                placeholder="Kata kunci..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={loadNews}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {loading && <LoadingSpinner />}
        {error && !loading && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 text-destructive p-4 text-sm">
            {error}
          </div>
        )}

        {!loading && grouped.length === 0 && !error && (
          <div className="text-center py-12 text-muted-foreground">
            <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Tidak ada berita untuk filter ini.</p>
          </div>
        )}

        {!loading && grouped.length > 0 && (
          <div className="space-y-6">
            {grouped.map(([monthKey, news]) => (
              <div key={monthKey}>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                  <Calendar className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">{formatMonthLabel(monthKey)}</h3>
                  <span className="text-xs text-muted-foreground">({news.length} berita)</span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {news.map((n, i) => (
                    <a
                      key={`${monthKey}-${i}`}
                      href={n.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${topicColor(n.topic)}`}>
                          {n.topic}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                      </div>
                      <h4 className="text-sm font-semibold text-foreground leading-snug mb-2 line-clamp-3 group-hover:text-primary transition-colors">
                        {n.title}
                      </h4>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="truncate max-w-[60%]">{n.source}</span>
                        <span>
                          {new Date(n.pubDate).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
