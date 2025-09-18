// default: JA (in raw HTML)

const I18N = (() => {
  const cache = new Map(); // lang -> dict
  const DEFAULT_LANG = "ja";
  const MISSING_CLASS = "i18n-missing";

  async function loadDict(lang) {
    if (lang === DEFAULT_LANG) return null; // use default
    if (cache.has(lang)) return cache.get(lang);
    const res = await fetch(`/locales/${lang}.json`, { cache: "no-store" });
    if (!res.ok) throw new Error(`i18n: failed to load ${lang}`);
    const dict = await res.json();
    cache.set(lang, dict);
    return dict;
  }

  function get(dict, key) {
    if (!dict) return undefined;
    return key.split(".").reduce((o, k) => (o && k in o ? o[k] : undefined), dict);
  }

  // 初回読み込み時にhtmlのjaの内容を保存
  function ensureOriginals(root = document) {
    // テキスト(入れ子なしの単一タグにdata-i18n=""をつける場合)
    root.querySelectorAll("[data-i18n]").forEach(el => {
      if (!el.hasAttribute("data-i18n-orig")) {
        el.setAttribute("data-i18n-orig", el.textContent);
      }
    });
    // HTML(中にタグを含む塊にdata-i18n-htmlを付ける場合)
    root.querySelectorAll("[data-i18n-html]").forEach(el => {
      if (!el.hasAttribute("data-i18n-orig-html")) {
        el.setAttribute("data-i18n-orig-html", el.innerHTML);
      }
    });
    // aria-...などの属性につける場合
    root.querySelectorAll("[data-i18n-attr]").forEach(el => {
      const raw = el.getAttribute("data-i18n-attr");
      try {
        const map = JSON.parse(raw);
        for (const attr of Object.keys(map)) {
          const k = `data-i18n-orig-attr-${attr}`;
          if (!el.hasAttribute(k)) {
            const v = el.getAttribute(attr);
            if (v != null) el.setAttribute(k, v);
          }
        }
      } catch (e) {
        console.error("i18n attr json parse error", e);
      }
    });
  }

  function applyText(el, dict, lang) {
    const key = el.getAttribute("data-i18n");
    if (!key) return;
    const val = get(dict, key);
    if (lang === DEFAULT_LANG) {
      el.textContent = el.getAttribute("data-i18n-orig") ?? el.textContent;
      el.classList.remove(MISSING_CLASS);
    } else if (val != null) {
      el.textContent = String(val);
      el.classList.remove(MISSING_CLASS);
    } else {
      // 未訳の場合はjaのまま
      el.textContent = el.getAttribute("data-i18n-orig") ?? el.textContent;
      el.classList.add(MISSING_CLASS);
    }
  }

  function applyHTML(el, dict, lang) {
    const key = el.getAttribute("data-i18n-html");
    if (!key) return;
    const val = get(dict, key);
    if (lang === DEFAULT_LANG) {
      el.innerHTML = el.getAttribute("data-i18n-orig-html") ?? el.innerHTML;
      el.classList.remove(MISSING_CLASS);
    } else if (val != null) {
      el.innerHTML = String(val);
      el.classList.remove(MISSING_CLASS);
    } else {
      el.innerHTML = el.getAttribute("data-i18n-orig-html") ?? el.innerHTML;
      el.classList.add(MISSING_CLASS);
    }
  }

  function applyAttrs(el, dict, lang) {
    const raw = el.getAttribute("data-i18n-attr");
    if (!raw) return;
    try {
      const map = JSON.parse(raw);
      for (const [attr, key] of Object.entries(map)) {
        const val = get(dict, key);
        const origAttr = `data-i18n-orig-attr-${attr}`;
        const orig = el.getAttribute(origAttr) ?? el.getAttribute(attr);

        if (lang === DEFAULT_LANG) {
          if (orig != null) el.setAttribute(attr, orig);
          el.classList.remove(MISSING_CLASS);
        } else if (val != null) {
          el.setAttribute(attr, String(val));
          el.classList.remove(MISSING_CLASS);
        } else {
          if (orig != null) el.setAttribute(attr, orig);
          el.classList.add(MISSING_CLASS);
        }
      }
    } catch (e) {
      console.error("i18n attr json parse error", e);
    }
  }

  function translateDocument(dict, lang) {
    ensureOriginals(); // 実質初回のみ
    document.querySelectorAll("[data-i18n]").forEach(el => applyText(el, dict, lang));
    document.querySelectorAll("[data-i18n-html]").forEach(el => applyHTML(el, dict, lang));
    document.querySelectorAll("[data-i18n-attr]").forEach(el => applyAttrs(el, dict, lang));

    // <title>にも付ける場合
    const titleEl = document.querySelector("title[data-i18n]");
    if (titleEl) applyText(titleEl, dict, lang);
  }

  async function setLanguage(lang) {
    const dict = await loadDict(lang);
    translateDocument(dict, lang);
  }

  return { setLanguage, DEFAULT_LANG };
})();
