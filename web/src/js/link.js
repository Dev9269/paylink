/* Build the shareable PayLink URL for a given asset + amount. */

export function buildLink(asset = "XLM", amount = 0) {
  const base = "https://paylink.astro/";
  return `${base}${encodeURIComponent(asset)}/${Number(amount).toFixed(2)}`;
}

export function formatAmount(n) {
  const v = Number.isFinite(n) ? n : 0;
  return v.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}
