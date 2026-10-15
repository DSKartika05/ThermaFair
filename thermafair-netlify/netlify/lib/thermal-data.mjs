import { getStore } from "@netlify/blobs";

export async function getReports() {
  const reportsStore = getStore("thermafair-reports");
  const { blobs } = await reportsStore.list({ prefix: "report/" });
  const reports = await Promise.all(
    blobs.map(({ key }) => reportsStore.get(key, { type: "json" })),
  );
  return reports.filter(Boolean);
}

function average(items) {
  if (!items.length) return null;
  const value = items.reduce((sum, item) => sum + Number(item), 0) / items.length;
  return Math.round(value * 10) / 10;
}

function groupReports(reports, field, includeAverage = false) {
  const groups = new Map();
  for (const report of reports) {
    const key = report[field];
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(report);
  }

  return Array.from(groups, ([key, items]) => ({
    [field]: key,
    count: items.length,
    ...(includeAverage ? { avgScore: average(items.map((item) => item.score)) } : {}),
  }));
}

export function summarizeReports(reports) {
  return {
    total: reports.length,
    avgScore: average(reports.map((report) => report.score)),
    avgTemp: average(reports.map((report) => report.currentTemp)),
    byZone: groupReports(reports, "zone"),
    byGender: groupReports(reports, "gender", true),
    byLocation: groupReports(reports, "location", true),
    byCondition: groupReports(reports, "condition"),
  };
}

export function reportsToCsv(reports) {
  const columns = [
    ["createdAt", "Waktu"],
    ["gender", "Gender"],
    ["ageGroup", "Kelompok usia"],
    ["clothing", "Pakaian"],
    ["location", "Lokasi"],
    ["currentTemp", "Suhu (°C)"],
    ["condition", "Kondisi"],
    ["score", "Skor"],
    ["zone", "Zona"],
  ];
  const cell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const rows = [
    columns.map(([, label]) => cell(label)).join(","),
    ...reports.map((report) =>
      columns.map(([field]) => cell(report[field])).join(","),
    ),
  ];
  return `\uFEFF${rows.join("\r\n")}\r\n`;
}
