/** Port of Features/Jobs/CreateJobView title + job number logic */

function extractCustomerName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length > 1) return parts[parts.length - 1] ?? "Unknown";
  return parts[0] ?? "Unknown";
}

const SUFFIX = new Set([
  "st", "street", "ave", "avenue", "rd", "road", "dr", "drive", "ln", "lane",
  "blvd", "boulevard", "ct", "court", "pl", "place", "way", "cir", "circle",
  "pkwy", "parkway",
]);

function normalizeStreetSuffix(suffix: string): string {
  const lower = suffix.toLowerCase();
  const m: Record<string, string> = {
    street: "St",
    st: "St",
    avenue: "Ave",
    ave: "Ave",
    road: "Rd",
    rd: "Rd",
    drive: "Dr",
    dr: "Dr",
    lane: "Ln",
    ln: "Ln",
    boulevard: "Blvd",
    blvd: "Blvd",
    court: "Ct",
    ct: " Ct",
    place: "Pl",
    pl: "Pl",
    way: "Way",
    circle: "Cir",
    cir: "Cir",
    parkway: "Pkwy",
    pkwy: "Pkwy",
  };
  return m[lower] ?? suffix.charAt(0).toUpperCase() + suffix.slice(1);
}

export function extractStreetName(address: string): string {
  let streetPart = address.trim().split(",")[0]?.trim() ?? address.trim();
  streetPart = streetPart.replace(/(apt|unit|#|suite|ste|apartment)\s*\w*/gi, "").trim();

  const streetPattern =
    /^\d+\s+([A-Za-z\s]+?)(?:\s+(?:St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Ln|Lane|Blvd|Boulevard|Ct|Court|Pl|Place|Way|Cir|Circle|Pkwy|Parkway))/i;
  const match = streetPart.match(streetPattern);
  if (match?.[0]) {
    let streetName = match[0].replace(/^\d+\s+/, "");
    const suffixPattern =
      /\s+(St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Ln|Lane|Blvd|Boulevard|Ct|Court|Pl|Place|Way|Cir|Circle|Pkwy|Parkway)$/i;
    const sr = streetName.match(suffixPattern);
    if (sr) {
      const suffix = sr[0].trim();
      streetName = streetName.replace(suffixPattern, "").trim();
      return (streetName + normalizeStreetSuffix(suffix)).replace(/\s+/g, "");
    }
  }

  const words = streetPart.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    let result = "";
    for (let i = 1; i < words.length; i++) {
      const w = words[i]!;
      if (SUFFIX.has(w.toLowerCase())) {
        result += normalizeStreetSuffix(w);
        break;
      }
      result += w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }
    return result || (words[1] ? words[1].charAt(0).toUpperCase() + words[1].slice(1).toLowerCase() : "Unknown");
  }
  if (words.length === 1) return words[0]!.charAt(0).toUpperCase() + words[0]!.slice(1).toLowerCase();

  const first = streetPart.split(/\s+/).find((w) => w && !/^\d+$/.test(w));
  return first ? first.charAt(0).toUpperCase() + first.slice(1).toLowerCase() : "Unknown";
}

export function generateJobTitle(args: {
  jobNumber: string;
  customerName: string;
  formattedAddress: string;
}): string {
  const cust = extractCustomerName(args.customerName);
  const street = extractStreetName(args.formattedAddress);
  return `${args.jobNumber}-${cust}-${street}`;
}

export function nextJobNumber(year: number, existingJobNumbers: string[]): string {
  const prefix = `${year}-`;
  let max = 0;
  for (const jn of existingJobNumbers) {
    if (!jn.startsWith(prefix)) continue;
    const n = parseInt(jn.slice(prefix.length), 10);
    if (!Number.isNaN(n)) max = Math.max(max, n);
  }
  return `${year}-${String(max + 1).padStart(5, "0")}`;
}
