(function () {
  'use strict';

  var escMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

  function esc(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
      return escMap[c];
    });
  }

  function escRe(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function highlight(escapedText, keyword) {
    if (!keyword) return escapedText;
    try {
      var re = new RegExp('(' + escRe(esc(keyword)) + ')', 'gi');
      return escapedText.replace(re, '<mark>$1</mark>');
    } catch (e) {
      return escapedText;
    }
  }

  /* ------------------------------------------------------------------ */
  /* 一、站内搜索（数据源：hexo-generator-searchdb 生成的 search.json）   */
  /* ------------------------------------------------------------------ */

  var overlay = document.getElementById('local-search');
  var input = document.getElementById('ls-input');
  var panelBody = document.getElementById('ls-body');
  var closeBtn = document.getElementById('ls-close');
  var trigger = document.getElementById('local-search-btn');

  if (overlay && input && panelBody) {
    var indexUrl = overlay.getAttribute('data-index') || '/search.json';

    var HINT = '<p class="ls-hint">输入关键词后自动检索本站全部文章，支持标题、正文、标签与分类。</p>';
    var docs = null;
    var loading = false;
    var results = [];
    var active = -1;
    var timer = null;

    /**
     * searchdb 的条目结构：{ title, url, content, categories?, tags? }
     * field: all 时它会把 source 下的 js/css 等静态资源也当页面收进来，
     * 这类条目没有 title、url 也不是 .html，这里统一过滤掉。
     */
    function normalize(raw) {
      if (!Array.isArray(raw)) return [];

      var items = [];

      raw.forEach(function (item) {
        if (!item || !item.title) return;

        var url = String(item.url || '');
        var ext = url.split('?')[0].match(/\.([a-z0-9]+)$/i);
        if (ext && !/^html?$/i.test(ext[1])) return;

        items.push({
          title: String(item.title),
          url: url,
          text: String(item.content || ''),
          tags: item.tags || [],
          categories: item.categories || []
        });
      });

      return items;
    }

    function loadIndex() {
      if (docs) return Promise.resolve(docs);
      if (loading) return Promise.resolve(null);
      loading = true;
      panelBody.innerHTML = '<p class="ls-hint">正在加载搜索索引…</p>';

      return fetch(indexUrl, { credentials: 'same-origin' })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        })
        .then(function (data) {
          docs = normalize(data);
          loading = false;
          return docs;
        })
        .catch(function () {
          docs = [];
          loading = false;
          panelBody.innerHTML = '<p class="ls-empty">搜索索引加载失败，请确认已安装 hexo-generator-searchdb 并重新执行 <code>hexo clean &amp;&amp; hexo generate</code>。</p>';
          return null;
        });
    }

    function snippet(text, keyword) {
      if (!text) return '';
      var lower = text.toLowerCase();
      var pos = lower.indexOf(keyword);

      if (pos < 0) return text.slice(0, 100);

      var start = Math.max(0, pos - 40);
      var piece = text.slice(start, start + 140);

      return (start > 0 ? '…' : '') + piece + (start + 140 < text.length ? '…' : '');
    }

    function render(list, keyword) {
      active = -1;

      if (!list.length) {
        panelBody.innerHTML = '<p class="ls-empty">没有找到与 “' + esc(keyword) + '” 相关的内容。</p>';
        return;
      }

      var html = '<ul class="ls-list">';

      list.forEach(function (doc, i) {
        var meta = (doc.tags && doc.tags.length)
          ? doc.tags.join(' / ')
          : (doc.categories || []).join(' / ');

        html += '<li class="ls-item" data-index="' + i + '">' +
          '<a class="ls-link" href="' + esc(doc.url) + '">' +
            '<span class="ls-title">' + highlight(esc(doc.title), keyword) + '</span>' +
            (meta ? '<span class="ls-meta">' + esc(meta) + '</span>' : '') +
            '<span class="ls-snippet">' + highlight(esc(snippet(doc.text, keyword)), keyword) + '</span>' +
          '</a>' +
        '</li>';
      });

      html += '</ul>';
      panelBody.innerHTML = html;
      panelBody.scrollTop = 0;
    }

    function setActive(index) {
      var items = panelBody.querySelectorAll('.ls-item');
      if (!items.length) return;

      if (index < 0) index = items.length - 1;
      if (index >= items.length) index = 0;

      items.forEach(function (item) { item.classList.remove('active'); });
      items[index].classList.add('active');
      active = index;
    }

    function search(rawKeyword) {
      if (!docs) return;

      var keyword = rawKeyword.trim().toLowerCase();

      if (!keyword) {
        results = [];
        panelBody.innerHTML = HINT;
        return;
      }

      var matched = [];

      docs.forEach(function (doc) {
        var title = doc.title.toLowerCase();
        var text = doc.text.toLowerCase();
        var tags = doc.tags.join(' ').toLowerCase();
        var cats = doc.categories.join(' ').toLowerCase();

        var score = 0;
        if (title.indexOf(keyword) > -1) score += 200;
        if (tags.indexOf(keyword) > -1) score += 60;
        if (cats.indexOf(keyword) > -1) score += 50;

        var hits = 0;
        var pos = text.indexOf(keyword);
        while (pos > -1 && hits < 30) {
          hits += 1;
          pos = text.indexOf(keyword, pos + keyword.length);
        }
        score += hits * 4;

        if (score > 0) matched.push({ doc: doc, score: score });
      });

      matched.sort(function (a, b) { return b.score - a.score; });
      results = matched.slice(0, 20).map(function (item) { return item.doc; });
      render(results, keyword);
    }

    function open() {
      overlay.classList.add('on');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.classList.add('ls-locked');
      input.focus();

      loadIndex().then(function () {
        if (docs) search(input.value);
      });
    }

    function close() {
      overlay.classList.remove('on');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('ls-locked');
      input.blur();
    }

    if (trigger) {
      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        open();
      });
      trigger.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      });
    }

    if (closeBtn) closeBtn.addEventListener('click', close);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });

    input.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        if (docs) {
          search(input.value);
        } else {
          loadIndex().then(function () {
            if (docs) search(input.value);
          });
        }
      }, 120);
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        close();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive(active + 1);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive(active - 1);
        return;
      }
      if (e.key === 'Enter' && active > -1) {
        e.preventDefault();
        var target = panelBody.querySelector('.ls-item.active .ls-link');
        if (target) window.location.href = target.getAttribute('href');
      }
    });

    panelBody.addEventListener('mouseover', function (e) {
      var item = e.target.closest && e.target.closest('.ls-item');
      if (item) setActive(Number(item.getAttribute('data-index')));
    });
  }

  /* ------------------------------------------------------------------ */
  /* 二、文章“复制链接”（替代主题自带的社交分享面板）                     */
  /* ------------------------------------------------------------------ */

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }

    return new Promise(function (resolve, reject) {
      var area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.top = '-1000px';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();

      var ok = false;
      try {
        ok = document.execCommand('copy');
      } catch (err) {
        ok = false;
      }
      document.body.removeChild(area);

      ok ? resolve() : reject(new Error('copy failed'));
    });
  }

  document.addEventListener('click', function (e) {
    var link = e.target.closest && e.target.closest('.article-copy-link');
    if (!link) return;

    e.preventDefault();

    var url = link.getAttribute('data-url') || window.location.href;
    var label = link.querySelector('.copy-label') || link;

    if (link.dataset.busy === '1') return;
    link.dataset.busy = '1';

    copyText(url)
      .then(function () { flash('已复制'); })
      .catch(function () { flash('复制失败'); });

    function flash(text) {
      var original = label.dataset.original || label.textContent;
      label.dataset.original = original;
      label.textContent = text;
      link.classList.add('copied');

      setTimeout(function () {
        label.textContent = original;
        link.classList.remove('copied');
        link.dataset.busy = '';
      }, 1600);
    }
  });
})();
