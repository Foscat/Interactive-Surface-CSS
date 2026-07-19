/*
 * State lab behavior.
 * Native controls own semantics; this module only coordinates state, focus, and recoverable demo workflows.
 */

(() => {
  "use strict";

  const main = document.getElementById("main-content");
  const statusRegion = document.getElementById("demoStatus");
  const actionExample = document.querySelector('[data-example="action"]');
  const toggleExample = document.querySelector('[data-example="toggle"]');
  const toggleState = document.getElementById("toggle-state");
  const loadingExample = document.querySelector('[data-example="loading"]');
  const iconExample = document.querySelector('[data-example="icon"]');
  const tabs = Array.from(
    document.querySelectorAll('#state-tabs [role="tab"]'),
  );
  const tokenCards = Array.from(
    document.querySelectorAll(".token-card[data-token]"),
  );
  const tokenEditButtons = Array.from(
    document.querySelectorAll("[data-token-edit]"),
  );
  const tokenCssImport = document.getElementById("tokenCssImport");
  const tokenCssCopy = document.getElementById("tokenCssCopy");
  const tokenCssDownload = document.getElementById("tokenCssDownload");
  const tokenEditorDialog = document.getElementById("token-editor-dialog");
  const tokenEditor = document.getElementById("tokenEditor");
  const tokenEditorTitle = document.getElementById("tokenEditorTitle");
  const tokenEditorName = document.getElementById("tokenEditorName");
  const tokenEditorValue = document.getElementById("tokenEditorValue");
  const tokenEditorCancel = document.getElementById("tokenEditorCancel");
  const embeddedReadme = document.getElementById("embeddedReadme");
  const readmeContent = document.getElementById("readmeContent");
  const tokenOverrides = new Map();
  let activeOpener = null;
  let activeTokenName = "";
  let dialogSessionActive = false;
  let persistDialogFeedbackOnClose = false;

  if (!main || !statusRegion) {
    return;
  }

  // Keep a stable home for the shared status node while it temporarily joins the native modal's top layer.
  const statusRegionHome = document.createComment("Shared status region home");
  statusRegion.parentNode?.insertBefore(statusRegionHome, statusRegion);

  // A single live region reports both successful actions and actionable recovery guidance.
  function setStatus(message, options = {}) {
    const { focus = false, tone = "" } = options;
    statusRegion.textContent = message;
    statusRegion.classList.toggle("is-error", tone === "error");
    statusRegion.classList.toggle("is-success", tone === "success");

    if (focus) {
      statusRegion.focus({ preventScroll: true });
    }
  }

  function clearStatus() {
    statusRegion.textContent = "";
    statusRegion.classList.remove("is-error", "is-success");
  }

  function setDialogStatus(message, options = {}) {
    const { persistOnClose = false, ...statusOptions } = options;
    persistDialogFeedbackOnClose = persistOnClose;
    setStatus(message, statusOptions);
  }

  // State examples mutate the same semantic attributes consumed by the stylesheet.
  actionExample?.addEventListener("click", () => {
    setStatus("Action example completed.", { tone: "success" });
  });

  toggleExample?.addEventListener("click", () => {
    const isPressed = toggleExample.getAttribute("aria-pressed") === "true";
    toggleExample.setAttribute("aria-pressed", String(!isPressed));
    if (toggleState) {
      toggleState.textContent = isPressed ? "Off" : "On";
    }
  });

  function activateTab(nextTab, { moveFocus = false } = {}) {
    tabs.forEach((candidate) => {
      const isSelected = candidate === nextTab;
      candidate.setAttribute("aria-selected", String(isSelected));
      candidate.tabIndex = isSelected ? 0 : -1;

      const panelId = candidate.getAttribute("aria-controls");
      const panel = panelId ? document.getElementById(panelId) : null;
      if (panel) {
        panel.hidden = !isSelected;
      }
    });

    if (moveFocus) {
      nextTab.focus();
    }
  }

  tabs.forEach((tab, tabIndex) => {
    tab.addEventListener("click", () => activateTab(tab));
    tab.addEventListener("keydown", (event) => {
      let nextIndex;

      // Tabs use automatic activation so keyboard focus and the visible panel stay synchronized.
      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
          nextIndex = (tabIndex + 1) % tabs.length;
          break;
        case "ArrowLeft":
        case "ArrowUp":
          nextIndex = (tabIndex - 1 + tabs.length) % tabs.length;
          break;
        case "Home":
          nextIndex = 0;
          break;
        case "End":
          nextIndex = tabs.length - 1;
          break;
        default:
          return;
      }

      event.preventDefault();
      activateTab(tabs[nextIndex], { moveFocus: true });
    });
  });

  loadingExample?.addEventListener("click", () => {
    if (loadingExample.getAttribute("aria-busy") === "true") {
      return;
    }

    loadingExample.setAttribute("aria-busy", "true");
    loadingExample.textContent = "Loading proof\u2026";

    window.setTimeout(() => {
      loadingExample.setAttribute("aria-busy", "false");
      loadingExample.textContent = "Run loading proof";
      setStatus("Loading state completed.", { tone: "success" });
    }, 800);
  });

  iconExample?.addEventListener("click", () => {
    setStatus(
      "The icon-only control exposes its purpose through an accessible name.",
    );
  });

  // Token helpers keep the editor, readouts, imported declarations, and export text synchronized.
  function editableTokenNames() {
    return tokenCards.map((card) => card.dataset.token).filter(Boolean);
  }

  function tokenReadout(tokenName) {
    return document.querySelector(
      `[data-token="${tokenName}"] [data-token-value]`,
    );
  }

  function currentTokenValue(tokenName) {
    if (tokenOverrides.has(tokenName)) {
      return tokenOverrides.get(tokenName);
    }

    const readout = tokenReadout(tokenName);
    return (
      readout?.textContent?.trim() ||
      getComputedStyle(document.documentElement)
        .getPropertyValue(tokenName)
        .trim()
    );
  }

  function updateTokenReadout(tokenName, tokenValue) {
    const readout = tokenReadout(tokenName);
    if (readout) {
      readout.textContent = tokenValue;
    }
  }

  function renderTokenOverrides() {
    let overrideStyle = document.getElementById("userTokenOverrides");
    if (!overrideStyle) {
      overrideStyle = document.createElement("style");
      overrideStyle.id = "userTokenOverrides";
      document.head.appendChild(overrideStyle);
    }

    const declarations = Array.from(
      tokenOverrides,
      ([tokenName, tokenValue]) => `  ${tokenName}: ${tokenValue};`,
    );
    overrideStyle.textContent = declarations.length
      ? `:root {\n${declarations.join("\n")}\n}`
      : "";
  }

  function buildTokenCss() {
    const declarations = editableTokenNames().map(
      (tokenName) => `  ${tokenName}: ${currentTokenValue(tokenName)};`,
    );
    return `:root {\n${declarations.join("\n")}\n}\n`;
  }

  function isSupportedColor(value) {
    return Boolean(value && window.CSS?.supports?.("color", value));
  }

  // Native dialog handling stores the exact opener, makes the background inert, and restores focus after cleanup.
  function dialogFocusables() {
    if (!tokenEditorDialog) {
      return [];
    }

    return Array.from(
      tokenEditorDialog.querySelectorAll(
        "button:not([disabled]), input:not([disabled])",
      ),
    ).filter((element) => element.tabIndex >= 0);
  }

  function restoreStatusRegion() {
    statusRegionHome.parentNode?.insertBefore(
      statusRegion,
      statusRegionHome.nextSibling,
    );
  }

  function restoreDialogContext() {
    // Validation guidance belongs only to its dialog session; successful changes remain useful globally.
    if (dialogSessionActive && !persistDialogFeedbackOnClose) {
      clearStatus();
    }
    restoreStatusRegion();
    dialogSessionActive = false;
    persistDialogFeedbackOnClose = false;
    main.inert = false;
    const openerToRestore = activeOpener;
    activeOpener = null;
    activeTokenName = "";

    if (openerToRestore?.isConnected) {
      openerToRestore.focus();
    }
  }

  function closeTokenEditor() {
    if (tokenEditorDialog?.open) {
      tokenEditorDialog.close();
    } else {
      restoreDialogContext();
    }
  }

  function openTokenEditor(trigger) {
    const card = trigger.closest(".token-card[data-token]");
    const tokenName = card?.dataset.token;
    if (
      !tokenName ||
      !tokenEditorDialog ||
      !tokenEditorTitle ||
      !tokenEditorName ||
      !tokenEditorValue
    ) {
      setStatus(
        "The token editor is unavailable. Reload the page and try again.",
        { focus: true, tone: "error" },
      );
      return;
    }

    activeOpener = trigger;
    activeTokenName = tokenName;
    tokenEditorTitle.textContent = `Edit ${tokenName}`;
    tokenEditorName.value = tokenName;
    tokenEditorValue.value = currentTokenValue(tokenName);
    clearStatus();
    dialogSessionActive = true;
    persistDialogFeedbackOnClose = false;
    // Feedback must be a dialog descendant while showModal() makes the rest of the document inert.
    tokenEditorDialog.append(statusRegion);
    main.inert = true;

    try {
      tokenEditorDialog.showModal();
      tokenEditorValue.focus();
      tokenEditorValue.select();
    } catch (_error) {
      restoreDialogContext();
      setStatus(
        "The token editor could not open. Reload the page and try again.",
        { focus: true, tone: "error" },
      );
    }
  }

  tokenEditButtons.forEach((trigger) => {
    trigger.addEventListener("click", () => openTokenEditor(trigger));
  });

  tokenEditorDialog?.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") {
      return;
    }

    const focusables = dialogFocusables();
    const first = focusables.at(0);
    const last = focusables.at(-1);
    if (!first || !last) {
      return;
    }

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  tokenEditorDialog?.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeTokenEditor();
  });

  tokenEditorDialog?.addEventListener("close", restoreDialogContext);
  tokenEditorCancel?.addEventListener("click", closeTokenEditor);

  tokenEditor?.addEventListener("submit", (event) => {
    event.preventDefault();
    const tokenValue = tokenEditorValue?.value.trim() || "";
    if (!activeTokenName || !isSupportedColor(tokenValue)) {
      setDialogStatus(
        "Enter a valid CSS color value, such as rgb(16 42 67), and try again.",
        {
          focus: true,
          tone: "error",
          persistOnClose: false,
        },
      );
      tokenEditorValue?.focus();
      return;
    }

    tokenOverrides.set(activeTokenName, tokenValue);
    renderTokenOverrides();
    updateTokenReadout(activeTokenName, tokenValue);
    setDialogStatus(
      `${activeTokenName} updated. Close the editor to review the state lab.`,
      {
        tone: "success",
        persistOnClose: true,
      },
    );
  });

  // File, clipboard, Blob URL, and download failures each receive a focused recovery message.
  tokenCssImport?.addEventListener("change", async () => {
    const file = tokenCssImport.files?.[0];
    if (!file) {
      return;
    }

    try {
      const cssText = await file.text();
      const supportedNames = new Set(editableTokenNames());
      const declarations = Array.from(
        cssText.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;{}]+);/gi),
      );
      const accepted = declarations.filter(
        (match) =>
          supportedNames.has(match[1]) && isSupportedColor(match[2].trim()),
      );

      if (!accepted.length) {
        setStatus(
          "No supported color tokens were found. Check the token names and try again.",
          {
            focus: true,
            tone: "error",
          },
        );
        return;
      }

      accepted.forEach((match) => {
        const tokenName = match[1];
        const tokenValue = match[2].trim();
        tokenOverrides.set(tokenName, tokenValue);
        updateTokenReadout(tokenName, tokenValue);
      });
      renderTokenOverrides();
      setStatus(
        `Imported ${accepted.length} token value${accepted.length === 1 ? "" : "s"}.`,
        { tone: "success" },
      );
    } catch (_error) {
      setStatus(
        "Token CSS import failed. Choose a readable CSS file and try again.",
        {
          focus: true,
          tone: "error",
        },
      );
    } finally {
      tokenCssImport.value = "";
    }
  });

  tokenCssCopy?.addEventListener("click", async () => {
    try {
      if (
        !navigator.clipboard ||
        typeof navigator.clipboard.writeText !== "function"
      ) {
        throw new Error("Clipboard API unavailable");
      }

      await navigator.clipboard.writeText(buildTokenCss());
      setStatus("Token CSS copied to the clipboard.", { tone: "success" });
    } catch (_error) {
      setStatus(
        "Token CSS could not be copied. Allow clipboard access and try again.",
        {
          focus: true,
          tone: "error",
        },
      );
    }
  });

  tokenCssDownload?.addEventListener("click", () => {
    let blobUrl = "";
    try {
      const blob = new Blob([buildTokenCss()], {
        type: "text/css;charset=utf-8",
      });
      blobUrl = URL.createObjectURL(blob);
    } catch (_error) {
      setStatus(
        "Token CSS download could not be prepared. Check browser download support and try again.",
        {
          focus: true,
          tone: "error",
        },
      );
      return;
    }

    const downloadLink = document.createElement("a");
    downloadLink.href = blobUrl;
    downloadLink.download = "interactive-surface-token-overrides.css";

    try {
      document.body.appendChild(downloadLink);
      downloadLink.click();
      setStatus("Token CSS download started.", { tone: "success" });
    } catch (_error) {
      setStatus(
        "Token CSS download could not start. Try again or use Copy token CSS.",
        {
          focus: true,
          tone: "error",
        },
      );
    } finally {
      downloadLink.remove();
      try {
        URL.revokeObjectURL(blobUrl);
      } catch (_error) {
        // URL cleanup is best-effort after the user-facing workflow has already completed.
      }
    }
  });

  // A line-oriented, dependency-free renderer keeps fenced code intact and all output inert.
  function renderMarkdown(markdownSource) {
    if (!readmeContent) {
      return;
    }

    const fragment = document.createDocumentFragment();
    const paragraphLines = [];
    const codeLines = [];
    let activeList = null;
    let activeListType = "";
    let inCodeFence = false;

    function flushParagraph() {
      if (!paragraphLines.length) {
        return;
      }

      const paragraph = document.createElement("p");
      paragraph.textContent = paragraphLines.join(" ");
      fragment.appendChild(paragraph);
      paragraphLines.length = 0;
    }

    function flushList() {
      if (activeList) {
        fragment.appendChild(activeList);
      }
      activeList = null;
      activeListType = "";
    }

    function flushCodeBlock() {
      const pre = document.createElement("pre");
      const code = document.createElement("code");
      code.textContent = codeLines.join("\n");
      pre.appendChild(code);
      fragment.appendChild(pre);
      codeLines.length = 0;
    }

    markdownSource
      .replace(/\r\n/g, "\n")
      .split("\n")
      .forEach((rawLine) => {
        if (/^\s*```/.test(rawLine)) {
          if (inCodeFence) {
            flushCodeBlock();
            inCodeFence = false;
          } else {
            flushParagraph();
            flushList();
            inCodeFence = true;
          }
          return;
        }

        if (inCodeFence) {
          codeLines.push(rawLine.replace(/^ {1,4}/, ""));
          return;
        }

        if (!rawLine.trim()) {
          flushParagraph();
          flushList();
          return;
        }

        const headingMatch = rawLine.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
          flushParagraph();
          flushList();
          // README headings are nested under the section heading, preserving one page-level h1.
          const headingLevel = Math.min(6, headingMatch[1].length + 2);
          const heading = document.createElement(`h${headingLevel}`);
          heading.textContent = headingMatch[2].trim();
          fragment.appendChild(heading);
          return;
        }

        const unorderedMatch = rawLine.match(/^\s*[-*]\s+(.+)$/);
        const orderedMatch = rawLine.match(/^\s*\d+\.\s+(.+)$/);
        const listMatch = unorderedMatch || orderedMatch;
        if (listMatch) {
          flushParagraph();
          const listType = unorderedMatch ? "ul" : "ol";
          if (!activeList || activeListType !== listType) {
            flushList();
            activeList = document.createElement(listType);
            activeListType = listType;
          }

          const item = document.createElement("li");
          item.textContent = listMatch[1].trim();
          activeList.appendChild(item);
          return;
        }

        flushList();
        paragraphLines.push(rawLine.trim());
      });

    if (inCodeFence) {
      flushCodeBlock();
    }
    flushParagraph();
    flushList();
    readmeContent.replaceChildren(fragment);
  }

  function renderReadmeReference() {
    const fallback =
      embeddedReadme?.textContent?.trim() || "# Interactive Surface CSS";
    renderMarkdown(fallback);
    document.body.dataset.demoReady = "true";

    if (!/^https?:$/.test(window.location.protocol)) {
      return;
    }

    fetch("./README.md", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`README request failed with ${response.status}`);
        }
        return response.text();
      })
      .then(renderMarkdown)
      .catch(() => {
        // The embedded fallback is already rendered, so a network failure needs no disruptive UI error.
      });
  }

  renderReadmeReference();
})();
