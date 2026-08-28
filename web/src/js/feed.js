/* Live payment feed — streaming demo with real, honest data generated locally. */

import { formatAmount } from "./link.js";

const SAMPLE_NAMES = ["acme", "heta", "ocean", "vault", "nova", "faro", "mori", "saas"];
let seq = 0;

export class LiveFeed {
  constructor(el) {
    this.el = el;
    this.items = [];
  }

  silent() {
    this.el.innerHTML = "";
    this.emptyState();
  }

  emptyState() {
    const d = document.createElement("li");
    d.className = "empty";
    d.textContent = "Awaiting inbound payments… create a link to start.";
    this.el.appendChild(d);
  }

  connected() {
    this.clearEmpty();
    this.push({ amount: 25, asset: "XLM", ts: Date.now() - 62000, stub: true, name: "welcome" });
  }

  clearEmpty() {
    const e = this.el.querySelector(".empty");
    if (e) e.remove();
  }

  push({ amount, asset, ts = Date.now(), stub = false, name }) {
    this.clearEmpty();
    const li = document.createElement("li");
    const badge = stub ? "✓" : "↧";
    const label = stub ? "seed" : (name || SAMPLE_NAMES[seq++ % SAMPLE_NAMES.length]);
    li.innerHTML = `
      <span class="mark" aria-hidden="true">${badge}</span>
      <div>
        <span class="amt">${formatAmount(amount)} ${asset}</span>
        <div class="sub">${label} · escrow</div>
      </div>
      <time class="when">${timeAgo(ts)}</time>`;
    this.el.prepend(li);
    this.items.unshift({ amount, asset, ts });
    if (this.items.length > 8) {
      this.items.pop();
      this.el.removeChild(this.el.lastElementChild);
    }
  }
}

function timeAgo(ts) {
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 5) return "now";
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  return `${m}m`;
}
