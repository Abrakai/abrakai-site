(function () {
  "use strict";

  const data = window.ABRAKAI_PROPERTY_TOOLS;
  const grid = document.querySelector("#tool-grid");
  const searchInput = document.querySelector("#tool-search");
  const clearButton = document.querySelector("#clear-search");
  const resultCount = document.querySelector("#result-count");
  const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
  const updatedNodes = document.querySelectorAll("[data-updated-at]");

  if (!data || !grid || !searchInput || !resultCount) return;

  const categoryMap = new Map(data.categories.map((category) => [category.id, category]));
  let activeCategory = "all";

  function normalize(value) {
    return String(value || "").toLocaleLowerCase("zh-Hant-TW").replace(/\s+/g, " ").trim();
  }

  function formatDate(value) {
    const parts = String(value).split("-");
    return parts.length === 3 ? `${parts[0]}.${parts[1]}.${parts[2]}` : value;
  }

  function createElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (typeof text === "string") element.textContent = text;
    return element;
  }

  function getDomain(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch (_error) {
      return url;
    }
  }

  function createToolCard(tool) {
    const category = categoryMap.get(tool.category);
    const article = createElement("article", `tool-card source-${tool.sourceType}`);
    article.dataset.category = tool.category;

    const head = createElement("div", "tool-card-head");
    const icon = createElement("span", "tool-icon", category ? category.icon : "•");
    icon.setAttribute("aria-hidden", "true");

    const labels = createElement("div", "tool-labels");
    labels.appendChild(createElement("span", "category-label", category ? category.name : "實用查詢"));
    labels.appendChild(createElement("span", `source-label source-label-${tool.sourceType}`, tool.sourceLabel));
    head.append(icon, labels);

    const name = createElement("h3", "tool-name", tool.name);
    const description = createElement("p", "tool-description", tool.description);

    const foot = createElement("div", "tool-card-foot");
    const domain = createElement("span", "tool-domain", getDomain(tool.url));
    domain.title = tool.url;

    const link = createElement("a", "tool-link", "前往查詢");
    link.href = tool.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer external";
    link.setAttribute("aria-label", `開啟「${tool.name}」外部網站（另開新視窗）`);
    const arrow = createElement("span", "tool-link-arrow", "↗");
    arrow.setAttribute("aria-hidden", "true");
    link.appendChild(arrow);

    foot.append(domain, link);
    article.append(head, name, description, foot);
    return article;
  }

  function getFilteredTools() {
    const query = normalize(searchInput.value);
    return data.tools.filter((tool) => {
      const category = categoryMap.get(tool.category);
      const categoryMatches = activeCategory === "all" || tool.category === activeCategory;
      const searchableText = normalize([
        tool.name,
        tool.description,
        tool.keywords,
        tool.sourceLabel,
        category && category.name
      ].join(" "));
      return categoryMatches && (!query || searchableText.includes(query));
    });
  }

  function render() {
    const tools = getFilteredTools();
    const fragment = document.createDocumentFragment();
    tools.forEach((tool) => fragment.appendChild(createToolCard(tool)));
    grid.replaceChildren(fragment);

    const query = searchInput.value.trim();
    resultCount.textContent = query || activeCategory !== "all"
      ? `找到 ${tools.length} 個符合條件的查詢入口`
      : `共整理 ${tools.length} 個查詢入口`;

    clearButton.hidden = query.length === 0;
    grid.classList.toggle("is-empty", tools.length === 0);
    if (tools.length === 0) {
      const empty = createElement("div", "empty-state");
      empty.append(
        createElement("strong", "", "沒有找到符合的網站"),
        createElement("p", "", "請換一個關鍵字，或改選「全部工具」。")
      );
      grid.appendChild(empty);
    }
  }

  function setActiveCategory(categoryId, updateUrl) {
    activeCategory = categoryMap.has(categoryId) ? categoryId : "all";
    filterButtons.forEach((button) => {
      const isActive = button.dataset.filter === activeCategory;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    if (updateUrl && window.history && window.history.replaceState) {
      const url = new URL(window.location.href);
      if (activeCategory === "all") url.searchParams.delete("category");
      else url.searchParams.set("category", activeCategory);
      window.history.replaceState({}, "", url);
    }
    render();
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => setActiveCategory(button.dataset.filter, true));
  });

  searchInput.addEventListener("input", render);
  clearButton.addEventListener("click", () => {
    searchInput.value = "";
    searchInput.focus();
    render();
  });

  updatedNodes.forEach((node) => {
    node.textContent = formatDate(data.updatedAt);
  });

  const initialCategory = new URLSearchParams(window.location.search).get("category") || "all";
  setActiveCategory(initialCategory, false);
})();
