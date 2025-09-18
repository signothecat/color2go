document.addEventListener("DOMContentLoaded", () => {
  // --------- getting DOM ---------
  const pickerA = document.getElementById("pickerA");
  const pickerB = document.getElementById("pickerB");
  const hexA = document.getElementById("hexA");
  const hexB = document.getElementById("hexB");
  const inputError = document.getElementById("inputError");
  const previewTextA = document.getElementById("previewTextA"); // 背景A/文字B
  const previewTextB = document.getElementById("previewTextB"); // 背景B/文字A
  const previewShapeA = document.getElementById("previewShapeA"); // 背景A + 円B
  const previewShapeB = document.getElementById("previewShapeB"); // 背景B + 円A
  const dotA = document.getElementById("dotA"); // 円A
  const dotB = document.getElementById("dotB"); // 円B
  const triangleA = document.getElementById("triangleA"); // 三角形A
  const triangleB = document.getElementById("triangleB"); // 三角形B
  const squareA = document.getElementById("squareA"); // 四角形A
  const squareB = document.getElementById("squareB"); // 四角形B
  const contrastValueEl = document.getElementById("contrastValue");
  const headingAAAEl = document.getElementById("headingAAA");
  const headingAAEl = document.getElementById("headingAA");
  const bodyAAAEl = document.getElementById("bodyAAA");
  const bodyAAEl = document.getElementById("bodyAA");
  const headingAAContainer = document.getElementById("headingAAContainer");
  const headingAAAContainer = document.getElementById("headingAAAContainer");
  const bodyAAContainer = document.getElementById("bodyAAContainer");
  const bodyAAAContainer = document.getElementById("bodyAAAContainer");
  const copyButtonA = document.getElementById("copyA");
  const copyButtonB = document.getElementById("copyB");
  const shuffleButtonA = document.getElementById("shuffleA");
  const shuffleButtonB = document.getElementById("shuffleB");
  const shuffleAllButton = document.getElementById("shuffleAll");
  const themeButton = document.getElementById("themeToggle");
  const langButton = document.getElementById("langToggle");
  const langList = document.getElementById("langList");
  const langChoice = Array.from(langList.querySelectorAll(".lang-choice"));
  const urlInput = document.getElementById("urlInput");
  const copyUrlButton = document.getElementById("copyUrl");
  const swapButton = document.getElementById("swapColors");

  // --------- end of getting DOM ---------

  // ------------- lang change variables --------------
  const SUPPORTED_LANGS = ["ja", "en"];
  const isLangMenuOpen = () => langButton.getAttribute("aria-expanded") === "true";
  // ------------- end of lang change variables --------------

  // --------- URL slug <-> hex utilities -----------
  // slug <-> hex
  const SLUG_RE = /^[0-9a-f]{6}-[0-9a-f]{6}$/;

  const colorsToSlug = (a, b) => `${a.replace("#", "").toLowerCase()}-${b.replace("#", "").toLowerCase()}`;

  const slugToColors = slug => {
    if (!slug || !SLUG_RE.test(slug)) return null;
    const [sa, sb] = slug.split("-");
    // 内部はあなたの実装に合わせて #RRGGBB の大文字にそろえる
    return { a: `#${sa}`.toUpperCase(), b: `#${sb}`.toUpperCase() };
  };

  function updateShareUrl() {
    if (urlInput) urlInput.value = window.location.href;
  }

  // --------- end of URL slug <-> hex conversion utilities -----------

  // --------- HEX Validation Utilities ---------
  const normalizeHex = raw => {
    // returns only #RRGGBB or null
    if (!raw) return null;
    let s = String(raw).trim(); // remove white space
    if (s.startsWith("#")) s = s.slice(1); // if startsWith #: remove #

    if (!/^[0-9A-Fa-f]+$/.test(s)) return null; // 0-9 or a-f only
    if (s.length < 3) return null; // 3+ digit only

    // 6桁以上は先頭6桁、4～5桁は先頭3桁を使う
    if (s.length >= 6) {
      s = s.slice(0, 6).toUpperCase(); // 6桁以上なら先頭6桁を採用
      return `#${s}`;
    } else {
      const rgb3 = s.slice(0, 3).toUpperCase(); // 6桁以上でなければ先頭3桁を採用
      const [r, g, b] = rgb3.split("");
      return `#${r}${r}${g}${g}${b}${b}`; // 先頭3桁を6桁に展開
    }
  };
  // --------- end of HEX Validation Utilities ---------

  // --------- HEX確定処理（blur or Enterで使用）---------
  // a or b を受け取って分岐
  function commitHex(side) {
    if (side === "a") {
      const hexValue = hexA.value;
      const n = normalizeHex(hexValue);
      const next = n ?? "#000000"; // n(normalizeHexの返り値)がnullでなければ左辺、nullなら右辺を返す
      hexA.value = next;
      pickerA.value = next;
    } else if (side === "b") {
      const hexValue = hexB.value;
      const n = normalizeHex(hexValue);
      const next = n ?? "#000000"; // n(normalizeHexの返り値)がnullでなければ左辺、nullなら右辺を返す
      hexB.value = next;
      pickerB.value = next;
    } else {
      console.error("commitHex: side は 'a' か 'b'");
      return;
    }
    inputError.textContent = "";
    render();
    syncUrlToColors({ replace: true });
  }
  // --------- end of HEX確定処理 ----------

  // --------- ピッカー変更時の処理 ---------
  // 常に有効値なのでnormalize->同期->render
  function applyPicker(side) {
    if (side === "a") {
      const next = normalizeHex(pickerA.value);
      pickerA.value = next;
      hexA.value = next;
    } else if (side === "b") {
      const next = normalizeHex(pickerB.value);
      pickerB.value = next;
      hexB.value = next;
    } else {
      console.error("applyPicker: side は 'a' か 'b'");
      return;
    }
    inputError.textContent = "";
    render();
    syncUrlToColors({ replace: true });
  }
  // --------- end of ピッカー変更時の処理 ---------

  // --------- ランダムHEX生成ユーティリティ ---------
  const randomHex = () =>
    `#${Math.floor(Math.random() * 0x1000000)
      .toString(16)
      .toUpperCase()
      .padStart(6, "0")}`; // 文字列.padStart(文字列の長さ[,埋める文字]);
  // --------- end of ランダムHEX生成ユーティリティ ---------

  // --------- HEXの大文字を小文字にするユーティリティ ---------
  const lowerHex = hex => {
    const s = typeof hex === "string" ? hex : String(hex ?? "");
    return `#${s.replace(/^#/, "").toLowerCase()}`;
  };

  // --------- コントラスト比計算ユーティリティ ---------
  // HEX -> RGB
  const hexToRgb = hex => {
    const h = hex.replace("#", "");
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return { r, g, b };
  };
  // sRGB -> 線形
  const srgbToLinear = v => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  // 相対輝度
  const relativeLuminance = ({ r, g, b }) => {
    const R = srgbToLinear(r);
    const G = srgbToLinear(g);
    const B = srgbToLinear(b);
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  };
  // コントラスト比（比の左側が返る、1.0〜21.0の範囲）
  const contrastRatio = (hex1, hex2) => {
    const L1 = relativeLuminance(hexToRgb(hex1));
    const L2 = relativeLuminance(hexToRgb(hex2));
    const light = Math.max(L1, L2);
    const dark = Math.min(L1, L2);
    return { ratio: (light + 0.05) / (dark + 0.05), L1, L2 };
  };
  // --------- コントラスト比計算ユーティリティここまで ---------

  // --------- アクセシビリティ判定ユーティリティ ---------
  // AAとAAAのしきい値を定義
  const THRESHOLDS = Object.freeze({
    heading: { AA: 3.0, AAA: 4.5 },
    body: { AA: 4.5, AAA: 7.0 }
  });
  // ratioから判定の真偽値を返す
  const judgeContrast = ratio => ({
    heading: {
      AA: ratio >= THRESHOLDS.heading.AA,
      AAA: ratio >= THRESHOLDS.heading.AAA
    },
    body: {
      AA: ratio >= THRESHOLDS.body.AA,
      AAA: ratio >= THRESHOLDS.body.AAA
    }
  });
  // AA・AAA判定欄の親コンテナにstateを付与し、判定のアイコンを更新
  const setJudgeState = (containerEl, iconEl, judgeBoolean) => {
    if (!containerEl) return;
    containerEl.dataset.judge = judgeBoolean ? "ok" : "ng"; // セレクタに[data-judge:ok]などでCSSを適用できるように
    if (iconEl) {
      iconEl.innerHTML = `<span class="material-symbols-rounded icon-judge">${judgeBoolean ? "check" : "block"}</span>`;
    }
  };
  // --------- end of アクセシビリティ判定ユーティリティ ---------

  // --------- 描画関数 ---------

  // レンダリング関数
  const render = () => {
    const a = pickerA.value;
    const b = pickerB.value;

    // プレビュー（テキストと図形）
    previewTextA.style.backgroundColor = a;
    previewTextA.style.color = b;
    previewTextA.style.borderColor = b;
    previewTextB.style.backgroundColor = b;
    previewTextB.style.color = a;
    previewTextB.style.borderColor = a;
    previewShapeA.style.backgroundColor = a;
    dotB.style.backgroundColor = b;
    triangleB.style.backgroundColor = b;
    squareB.style.backgroundColor = b;
    previewShapeB.style.backgroundColor = b;
    dotA.style.backgroundColor = a;
    triangleA.style.backgroundColor = a;
    squareA.style.backgroundColor = a;

    // コントラスト計算
    const { ratio } = contrastRatio(a, b);
    contrastValueEl.textContent = ratio.toFixed(2) + "：1";

    // 判定結果に応じて親コンテナにdata-judgeをつけ、アイコンを更新
    const judgeBoolean = judgeContrast(ratio);
    setJudgeState(headingAAContainer, headingAAEl, judgeBoolean.heading.AA);
    setJudgeState(headingAAAContainer, headingAAAEl, judgeBoolean.heading.AAA);
    setJudgeState(bodyAAContainer, bodyAAEl, judgeBoolean.body.AA);
    setJudgeState(bodyAAAContainer, bodyAAAEl, judgeBoolean.body.AAA);
  };

  // --------- 描画関数ここまで ---------

  // --------- 初期化関数 ---------

  // コントラスト一定以上の2色をランダム生成する関数
  const initRandomPair = (minRatio = 3.1) => {
    const maxAttempts = 2000;
    let best = null;
    let bestScore = 0;

    for (let i = 0; i < maxAttempts; i++) {
      const a = randomHex();
      const b = randomHex();
      const { ratio } = contrastRatio(a, b);

      if (ratio >= minRatio) {
        return { a, b }; // しきい値クリア → 即採用
      }

      // 万一しきい値に届かない場合の保険：最も近い組み合わせを覚えておく
      const score = ratio / minRatio; // 1に近いほど良い
      if (!best || score > bestScore) {
        best = { a, b };
        bestScore = score;
      }
    }

    // すべて失敗したらベスト近似を返す（保険）
    return best;
  };

  // --------- end of 初期化関数 ---------

  // --------- Event Listeners ---------

  // 同期：HEX変更イベントで発火（blurもしくはEnter押下で反映）
  hexA.addEventListener("blur", () => commitHex("a")); // フォーカスが外れたらcommitHex
  hexA.addEventListener("keydown", e => {
    if ((e.key === "Enter" || e.key === "NumpadEnter") && !e.isComposing) commitHex("a"); // Enter押下でcommitHex
  });
  hexB.addEventListener("blur", () => commitHex("b")); // フォーカスが外れたらcommitHex
  hexB.addEventListener("keydown", e => {
    if ((e.key === "Enter" || e.key === "NumpadEnter") && !e.isComposing) commitHex("b"); // Enter押下でcommitHex
  });

  // inputエリアにフォーカスした際にテキストを全選択
  hexA.addEventListener("focus", () => hexA.select());
  hexB.addEventListener("focus", () => hexB.select());

  // 同期：カラーピッカー変更で発火（リアルタイムで反映）
  pickerA.addEventListener("input", () => applyPicker("a"));
  pickerB.addEventListener("input", () => applyPicker("b"));

  // コピー機能：コピーボタン押下で発火
  // aとbの共通関数
  function setupCopyButton(button, textProvider) {
    if (!button) return;
    const icon = button.querySelector("[class*='material-symbols']");
    if (!icon) return;

    const idleIcon = icon.textContent.trim(); // ← ここで初期アイコンを拾う
    const successIcon = "check";
    let resetTimerId = null; // タイマーidをボタンごとに所持

    button.addEventListener("click", () => writeClipboardText("<empty clipboard>"));
    async function writeClipboardText() {
      try {
        await navigator.clipboard.writeText(textProvider());
        // const icon = button.querySelector(".icon-copy");
        // if (!icon) return;

        // ---- 古いタイマーをクリア ----
        if (resetTimerId) {
          clearTimeout(resetTimerId);
          resetTimerId = null;
        }

        // ---- 強制リセット ----
        icon.textContent = idleIcon;
        button.classList.remove("is-copied");

        // ---- コピー成功表示 ----
        icon.textContent = successIcon;
        button.classList.add("is-copied");

        // ---- 1秒後に戻す（最新だけ残す） ----
        resetTimerId = setTimeout(() => {
          icon.textContent = idleIcon;
          button.classList.remove("is-copied");
          resetTimerId = null; // 終わったら破棄
        }, 1200);
      } catch {
        alert("コピーに失敗しました");
      }
    }

    // button.addEventListener("click", async () => {
    //   if (!navigator.clipboard) {
    //     alert("このブラウザはクリップボードに対応していません");
    //     return;
    //   }
    //   try {
    //     await navigator.clipboard.writeText(textProvider());
    //     // const icon = button.querySelector(".icon-copy");
    //     // if (!icon) return;

    //     // ---- 古いタイマーをクリア ----
    //     if (resetTimerId) {
    //       clearTimeout(resetTimerId);
    //       resetTimerId = null;
    //     }

    //     // ---- 強制リセット ----
    //     icon.textContent = idleIcon;
    //     button.classList.remove("is-copied");

    //     // ---- コピー成功表示 ----
    //     icon.textContent = successIcon;
    //     button.classList.add("is-copied");

    //     // ---- 1秒後に戻す（最新だけ残す） ----
    //     resetTimerId = setTimeout(() => {
    //       icon.textContent = idleIcon;
    //       button.classList.remove("is-copied");
    //       resetTimerId = null; // 終わったら破棄
    //     }, 1200);
    //   } catch {
    //     alert("コピーに失敗しました");
    //   }
    // });
  }
  // それぞれのボタンに設定
  setupCopyButton(copyButtonA, () => lowerHex(hexA.value));
  setupCopyButton(copyButtonB, () => lowerHex(hexB.value));
  setupCopyButton(copyUrlButton, () => urlInput.value);

  // 生成したランダムHEXをボタンクリックでhex-inputに入れる
  if (shuffleButtonA) {
    // getElementでnullが返った場合の保険
    shuffleButtonA.addEventListener("click", () => {
      const c = normalizeHex(randomHex());
      hexA.value = c;
      pickerA.value = c;
      render();
      syncUrlToColors({ replace: true });
    });
  }
  if (shuffleButtonB) {
    // getElementでnullが返った場合の保険
    shuffleButtonB.addEventListener("click", () => {
      const c = normalizeHex(randomHex());
      hexB.value = c;
      pickerB.value = c;
      render();
      syncUrlToColors({ replace: true });
    });
  }

  // 色入れ替えボタン
  if (swapButton) {
    swapButton.addEventListener("click", () => {
      swapColors();
    });
  }

  // 2色をまとめてシャッフルするボタン
  if (shuffleAllButton) {
    // getElementでnullが返った場合の保険
    shuffleAllButton.addEventListener("click", () => {
      const c1 = normalizeHex(randomHex());
      const c2 = normalizeHex(randomHex());
      hexA.value = c1;
      pickerA.value = c1;
      hexB.value = c2;
      pickerB.value = c2;
      render();
      syncUrlToColors({ replace: true });
    });
  }
  // --------- end of Event Listeners ---------

  // メニュー開閉用の関数
  function openLangMenu({ focus = "first" } = {}) {
    langButton.setAttribute("aria-expanded", "true");
    langList.style.display = "block";
    // フォーカス移動
    if (focus === "first") {
      langChoice[0]?.focus();
    } else if (focus === "last") {
      langChoice[langChoice.length - 1]?.focus();
    }
  }
  function closeLangMenu({ returnFocus = true } = {}) {
    langButton.setAttribute("aria-expanded", "false");
    langList.style.display = "none";
    if (returnFocus) langButton.focus();
  }

  function moveLangMenuFocus(delta) {
    const currentIndex = langChoice.indexOf(document.activeElement);
    let nextIndex = currentIndex + delta;
    if (nextIndex < 0) nextIndex = langChoice.length - 1; // 上で循環
    if (nextIndex >= langChoice.length) nextIndex = 0; // 下で循環
    langChoice[nextIndex].focus();
  }

  // クリックで開閉
  langButton?.addEventListener("click", () => {
    isLangMenuOpen() ? closeLangMenu({ returnFocus: true }) : openLangMenu({ focus: "first" });
  });

  // 地球儀ボタン上でのキーボード操作
  langButton?.addEventListener("keydown", e => {
    switch (e.key) {
      case "ArrowDown":
      case "Down":
        e.preventDefault();
        openLangMenu({ focus: "first" });
        break;
      case "ArrowUp":
      case "Up":
        e.preventDefault();
        openLangMenu({ focus: "last" });
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        openLangMenu({ focus: "first" });
        break;
      case "Escape":
      case "Esc":
        e.preventDefault();
        closeLangMenu({ returnFocus: true });
        break;
    }
  });

  // 言語メニュー内のキーボード操作
  langList.addEventListener("keydown", e => {
    if (!isLangMenuOpen()) return;

    switch (e.key) {
      case "ArrowDown":
      case "Down":
        e.preventDefault();
        moveLangMenuFocus(1);
        break;
      case "ArrowUp":
      case "Up":
        e.preventDefault();
        moveLangMenuFocus(-1);
        break;
      case "Home":
        e.preventDefault();
        langChoice[0].focus();
        break;
      case "End":
        e.preventDefault();
        langChoice[langChoice.length - 1].focus();
        break;
      case "Enter":
      case " ":
        // 決定（クリックと同じ動き）
        e.preventDefault();
        document.activeElement?.click();
        break;
      case "Escape":
      case "Esc":
        e.preventDefault();
        closeLangMenu({ returnFocus: true });
        break;
      case "Tab":
        // タブ移動でメニュー閉じる（自然な挙動）
        closeLangMenu({ returnFocus: false });
        break;
    }
  });

  // 外側クリックで閉じる
  document.addEventListener("click", e => {
    if (!isLangMenuOpen()) return;
    if (!langButton.contains(e.target) && !langList.contains(e.target)) {
      closeLangMenu({ returnFocus: false });
    }
  });

  // メニュー項目クリック時の処理
  langChoice.forEach(btn => {
    btn.addEventListener("click", () => {
      const lang = btn.dataset.lang; // "en" / "ja"
      closeLangMenu({ returnFocus: true });
    });
  });

  // urlをparseする
  function parseRoute() {
    const parts = location.pathname.replace(/\/+$/, "").split("/").filter(Boolean);
    const lang = SUPPORTED_LANGS.includes(parts[0]) ? parts[0] : null;
    const slug = parts[1] ?? null; // カラーコード反映用 /en/xxxxxx-xxxxxx
    return { lang, slug };
  }

  // lang change
  async function applyLang(lang) {
    // <html lang="">を更新
    document.documentElement.setAttribute("lang", lang);

    // メニューで選択中の言語のハイライト用にクラス追加
    for (const btn of langChoice) {
      const active = btn.dataset.lang === lang;
      if (active) {
        btn.setAttribute("aria-current", "true");
      } else {
        btn.removeAttribute("aria-current");
      }

      btn.classList.toggle("is-active", active);
    }

    // 辞書ロードと置換
    try {
      await I18N.setLanguage(lang);
    } catch (e) {
      console.error(e);
    }
  }

  function buildUrl(lang, slug = null) {
    return `/${lang}${slug ? "/" + slug : ""}`;
  }

  function navigateTo(lang, { replace = true, slug = null } = {}) {
    const url = buildUrl(lang, slug);
    if (replace) history.replaceState({ lang, slug }, "", url);
    else history.pushState({ lang, slug }, "", url);
    applyLang(lang);

    updateShareUrl();
  }

  // 初期化(URLから色を反映)
  (function boot() {
    const { lang, slug } = parseRoute();

    // 言語がない場合/jaに差し替え
    if (!lang) {
      navigateTo("ja", { replace: true });
    } else {
      applyLang(lang);
    }

    // 色はslug優先。なければランダム生成してURLに反映
    const decoded = slugToColors(slug);
    if (decoded) {
      setColors(decoded); // URLの色をUIに反映
    } else {
      const { a: initA, b: initB } = initRandomPair(3.1);
      setColors({ a: initA, b: initB });
      syncUrlToColors({ replace: true }); // URLの末尾に/lang/slugを付与
    }

    updateShareUrl(); // 保険
  })();

  // 戻る/進む
  window.addEventListener("popstate", () => {
    const { lang, slug } = parseRoute();
    applyLang(lang ?? "ja");
    const decoded = slugToColors(slug);
    if (decoded) setColors(decoded);
    updateShareUrl();
  });

  // メニュー項目クリックでURL更新(slugはそのまま)
  langChoice.forEach(btn => {
    btn.addEventListener("click", () => {
      const lang = btn.dataset.lang; // en or ja
      const { a, b } = getCurrentColors();
      const slug = colorsToSlug(a, b); // URLはそのまま
      navigateTo(lang, { slug });
      closeLangMenu({ returnFocus: true });
    });
  });

  // ----------- end of lang change ------------

  // ---------- url color parse -----------
  function getCurrentColors() {
    return { a: pickerA.value, b: pickerB.value };
  }

  function setColors({ a, b }) {
    // normalizeして input / picker 両方に同期
    const A = normalizeHex(a) ?? "#000000";
    const B = normalizeHex(b) ?? "#000000";
    hexA.value = A;
    pickerA.value = A;
    hexB.value = B;
    pickerB.value = B;
    render();
  }

  // URL の slug と現在色がズレてたら揃える
  function syncUrlToColors({ replace = true } = {}) {
    const { lang, slug: nowSlugInUrl } = parseRoute();
    const { a, b } = getCurrentColors();
    const wantSlug = colorsToSlug(a, b);
    if (nowSlugInUrl !== wantSlug) {
      // 既存 navigateTo を活かす（slug を渡す）
      navigateTo(lang ?? "ja", { replace, slug: wantSlug });
    }
    updateShareUrl();
  }
  // ---------- end of url color parse -----------

  // ----------- swap colors --------------
  function swapColors() {
    const { a, b } = getCurrentColors(); // 現在の色を取得
    setColors({ a: b, b: a }); // UI(hex-input, color-picker, preview)を更新
    syncUrlToColors({ replace: true }); // URLの/lang/slugに反映(履歴には反映しない)
  }
  // ----------- end of swap colors --------------

  // --------- toggle theme ---------

  const html = document.documentElement;

  // 起動時：保存があれば優先、なければOS設定
  const savedTheme = localStorage.getItem("theme"); // 'light' | 'dark' | null
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initial = savedTheme ?? (prefersDark ? "dark" : "light");

  html.setAttribute("data-theme", initial);
  if (themeButton) themeButton.setAttribute("aria-pressed", String(initial === "dark"));

  // クリックでダークモードとライトモードをトグル切り替え
  function toggleTheme() {
    const nowDark = html.getAttribute("data-theme") === "dark";
    const next = nowDark ? "light" : "dark";
    html.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    if (themeButton) themeButton.setAttribute("aria-pressed", String(next === "dark"));
  }

  if (themeButton) {
    themeButton.addEventListener("click", toggleTheme);
    // 念のためspaceの既定動作を防ぐ
    themeButton.addEventListener("keydown", e => {
      if (e.code === "Space") {
        e.preventDefault();
        toggleTheme();
      }
    });
  }
  // --------- end of toggle theme ---------
});
