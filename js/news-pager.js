(function () {
  async function loadNews(sourceUrl) {
    const res = await fetch(sourceUrl, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch news source: " + res.status);
    const htmlText = await res.text();
    const doc = new DOMParser().parseFromString(htmlText, "text/html");
    const rows = Array.from(doc.querySelectorAll(".news-table tbody tr"));
    return rows.map((tr) => {
      const date = tr.querySelector(".date")?.textContent?.trim() || "";
      const content = tr.querySelector(".content")?.textContent?.trim() || tr.textContent.trim();
      return { date, content };
    }).filter(n => n.date || n.content);
  }

  function renderNews(items, page, perPage) {
    const tbody = document.getElementById("news-table-body");
    const pager = document.getElementById("news-pager");
    if (!tbody || !pager) return;

    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const cur = Math.min(Math.max(1, page), totalPages);

    const start = (cur - 1) * perPage;
    const slice = items.slice(start, start + perPage);

    tbody.innerHTML = "";
    slice.forEach((it) => {
      const tr = document.createElement("tr");
      const tdDate = document.createElement("td");
      tdDate.className = "date";
      tdDate.textContent = it.date;
      const tdContent = document.createElement("td");
      tdContent.className = "content";
      tdContent.textContent = it.content;
      tr.appendChild(tdDate);
      tr.appendChild(tdContent);
      tbody.appendChild(tr);
    });

    function pageLink(p, label, disabled) {
      const a = document.createElement("a");
      a.textContent = label;
      a.href = disabled ? "javascript:void(0)" : `?page=${p}`;
      a.style.margin = "0 8px";
      a.style.textDecoration = "none";
      a.style.color = disabled ? "#9ca3af" : "#2563eb";
      a.style.pointerEvents = disabled ? "none" : "auto";
      return a;
    }

    pager.innerHTML = "";
    pager.appendChild(pageLink(cur - 1, "← Prev", cur <= 1));

    // show up to 7 page numbers
    const windowSize = 7;
    let left = Math.max(1, cur - Math.floor(windowSize / 2));
    let right = Math.min(totalPages, left + windowSize - 1);
    left = Math.max(1, right - windowSize + 1);

    if (left > 1) {
      pager.appendChild(pageLink(1, "1", false));
      if (left > 2) {
        const span = document.createElement("span");
        span.textContent = "…";
        span.style.margin = "0 6px";
        pager.appendChild(span);
      }
    }

    for (let p = left; p <= right; p++) {
      const a = pageLink(p, String(p), false);
      if (p === cur) {
        a.style.fontWeight = "700";
        a.style.color = "#111827";
        a.style.pointerEvents = "none";
      }
      pager.appendChild(a);
    }

    if (right < totalPages) {
      if (right < totalPages - 1) {
        const span = document.createElement("span");
        span.textContent = "…";
        span.style.margin = "0 6px";
        pager.appendChild(span);
      }
      pager.appendChild(pageLink(totalPages, String(totalPages), false));
    }

    pager.appendChild(pageLink(cur + 1, "Next →", cur >= totalPages));
  }

  async function init() {
    const holder = document.getElementById("news-holder");
    if (!holder) return;
    const sourceUrl = holder.getAttribute("data-src") || "/index.html";
    const perPage = parseInt(holder.getAttribute("data-per-page") || "10", 10);

    const params = new URLSearchParams(window.location.search);
    const page = parseInt(params.get("page") || "1", 10);

    try {
      const items = await loadNews(sourceUrl);
      renderNews(items, page, perPage);
    } catch (e) {
      const tbody = document.getElementById("news-table-body");
      if (tbody) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 2;
        td.textContent = "Failed to load news.";
        tr.appendChild(td);
        tbody.appendChild(tr);
      }
      console.error(e);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();