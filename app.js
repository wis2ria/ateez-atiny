// 讀取 data/content.json，把內容畫到頁面上。
// 內容一律用 textContent 寫入，資料檔裡的文字不會被當成 HTML 執行。
(function () {
  "use strict";

  var YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function setText(id, text) {
    var node = document.getElementById(id);
    if (node) node.textContent = text || "";
  }

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  // 影片先顯示成一張可點的卡片，點了才載入 YouTube 播放器，
  // 這樣頁面開得快，訪客沒點之前也不會連到 YouTube。
  function buildPlayer(video) {
    var player = el("div", "player");
    var button = el("button", "player-button");
    button.type = "button";
    button.setAttribute("aria-label", "播放：" + video.title);
    button.appendChild(el("span", "play-icon"));
    button.appendChild(el("span", "player-title", video.title));
    button.appendChild(el("span", "player-hint", "點一下在這裡播放"));
    button.addEventListener("click", function () {
      var frame = document.createElement("iframe");
      frame.src =
        "https://www.youtube-nocookie.com/embed/" +
        video.youtubeId +
        "?autoplay=1&rel=0";
      frame.title = video.title;
      frame.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      frame.allowFullscreen = true;
      frame.referrerPolicy = "strict-origin-when-cross-origin";
      player.replaceChildren(frame);
    });
    player.appendChild(button);
    return player;
  }

  function buildVideo(video, index) {
    var item = el("li", "video-item");
    item.appendChild(buildPlayer(video));

    var body = el("div", "video-body");
    var meta = el("div", "video-meta");
    meta.appendChild(el("span", "video-number", pad(index + 1)));
    if (video.task) meta.appendChild(el("span", "tag tag-task", video.task));
    if (video.kind) meta.appendChild(el("span", "tag", video.kind));
    body.appendChild(meta);
    body.appendChild(el("h3", "video-title", video.title));
    body.appendChild(el("p", "video-recommendation", video.recommendation));

    var link = el("a", "video-link", "在 YouTube 上觀看");
    link.href = "https://www.youtube.com/watch?v=" + video.youtubeId;
    link.target = "_blank";
    link.rel = "noopener";
    body.appendChild(link);

    item.appendChild(body);
    return item;
  }

  function isShown(video) {
    // 預設只顯示「精選」；沒標記的也當成精選。
    return (
      video &&
      typeof video.title === "string" &&
      YOUTUBE_ID.test(video.youtubeId || "") &&
      (!video.tier || video.tier === "精選")
    );
  }

  function isSafeLink(url) {
    return typeof url === "string" && /^https:\/\//.test(url);
  }

  function render(data) {
    var site = data.site || {};
    var mustWatch = data.mustWatch || {};
    var more = data.more || {};

    if (site.name) {
      setText("site-name", site.name);
      document.title = site.name;
    }
    document.getElementById("preview-banner").hidden = !site.preview;
    setText("unofficial-notice", site.unofficialNotice);
    setText("footer-notice", site.footerNotice);

    setText("must-watch-heading", mustWatch.heading);
    setText("must-watch-lead", mustWatch.lead);
    var list = document.getElementById("video-list");
    (mustWatch.videos || []).filter(isShown).forEach(function (video, index) {
      list.appendChild(buildVideo(video, index));
    });

    setText("more-heading", more.heading);
    setText("more-lead", more.lead);
    var links = document.getElementById("more-links");
    (more.links || []).forEach(function (entry) {
      if (!entry || !isSafeLink(entry.url)) return;
      var li = el("li");
      var a = el("a", "", entry.label || entry.url);
      a.href = entry.url;
      a.target = "_blank";
      a.rel = "noopener";
      li.appendChild(a);
      if (entry.note) li.appendChild(el("p", "more-note", entry.note));
      links.appendChild(li);
    });
  }

  function showError() {
    var box = document.getElementById("load-error");
    box.textContent =
      "內容暫時讀不出來。如果你剛改過內容，可能是資料檔的格式有誤，請回到編輯器檢查後再儲存一次。";
    box.hidden = false;
  }

  fetch("data/content.json", { cache: "no-cache" })
    .then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    })
    .then(render)
    .catch(showError);
})();
