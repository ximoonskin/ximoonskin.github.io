(function ($) {
  // Search
  var $searchWrap = $('#search-form-wrap'),
    isSearchAnim = false,
    searchAnimDuration = 200;

  var startSearchAnim = function () {
    isSearchAnim = true;
  };

  var stopSearchAnim = function (callback) {
    setTimeout(function () {
      isSearchAnim = false;
      callback && callback();
    }, searchAnimDuration);
  };

  $('.nav-search-btn').on('click', function () {
    if (isSearchAnim) return;

    startSearchAnim();
    $searchWrap.addClass('on');
    stopSearchAnim(function () {
      $('.search-form-input').focus();
    });
  });

  $('.search-form-input').on('blur', function () {
    startSearchAnim();
    $searchWrap.removeClass('on');
    stopSearchAnim();
  });

  // Share
  // $('body').on('click', function(){
  //   $('.article-share-box.on').removeClass('on');
  // }).on('click', '.article-share-link', function(e){
  //   e.stopPropagation();

  //   var $this = $(this),
  //     url = $this.attr('data-url'),
  //     encodedUrl = encodeURIComponent(url),
  //     id = 'article-share-box-' + $this.attr('data-id'),
  //     title = $this.attr('data-title'),
  //     offset = $this.offset();

  //   if ($('#' + id).length){
  //     var box = $('#' + id);

  //     if (box.hasClass('on')){
  //       box.removeClass('on');
  //       return;
  //     }
  //   } else {
  //     var html = [
  //       '<div id="' + id + '" class="article-share-box">',
  //         '<input class="article-share-input" value="' + url + '">',
  //         '<div class="article-share-links">',
  //           '<a href="https://twitter.com/intent/tweet?text=' + encodeURIComponent(title) + '&url=' + encodedUrl + '" class="article-share-twitter" target="_blank" title="Twitter"><span class="fa fa-twitter"></span></a>',
  //           '<a href="https://www.facebook.com/sharer.php?u=' + encodedUrl + '" class="article-share-facebook" target="_blank" title="Facebook"><span class="fa fa-facebook"></span></a>',
  //           '<a href="http://pinterest.com/pin/create/button/?url=' + encodedUrl + '" class="article-share-pinterest" target="_blank" title="Pinterest"><span class="fa fa-pinterest"></span></a>',
  //           '<a href="https://www.linkedin.com/shareArticle?mini=true&url=' + encodedUrl + '" class="article-share-linkedin" target="_blank" title="LinkedIn"><span class="fa fa-linkedin"></span></a>',
  //         '</div>',
  //       '</div>'
  //     ].join('');

  //     var box = $(html);

  //     $('body').append(box);
  //   }

  //   $('.article-share-box.on').hide();

  //   box.css({
  //     top: offset.top + 25,
  //     left: offset.left
  //   }).addClass('on');
  // }).on('click', '.article-share-box', function(e){
  //   e.stopPropagation();
  // }).on('click', '.article-share-box-input', function(){
  //   $(this).select();
  // }).on('click', '.article-share-box-link', function(e){
  //   e.preventDefault();
  //   e.stopPropagation();

  //   window.open(this.href, 'article-share-box-window-' + Date.now(), 'width=500,height=450');
  // });

  // 原有的分享功能代码（保留框架，修改内容）
  $('body').on('click', function () {
    $('.article-share-box.on').removeClass('on');
  }).on('click', '.article-share-link', function (e) {
    e.stopPropagation();

    var $this = $(this),
      url = $this.attr('data-url'),
      encodedUrl = encodeURIComponent(url),
      id = 'article-share-box-' + $this.attr('data-id'),
      title = $this.attr('data-title'),
      offset = $this.offset();

    if ($('#' + id).length) {
      var box = $('#' + id);

      if (box.hasClass('on')) {
        box.removeClass('on');
        return;
      }
    } else {
      // 修改：创建复制链接的界面，替代社交媒体分享
      var html = [
        '<div id="' + id + '" class="article-share-box">',
        '<div class="article-share-copy-container">',
        '<input class="article-share-input" value="' + url + '" readonly>',
        '<button class="article-share-copy-btn" type="button">',
        '<span class="fa fa-copy"></span> 复制链接',
        '</button>',
        '</div>',
        '<div class="article-share-copied">链接已复制到剪贴板</div>',
        '</div>'
      ].join('');

      var box = $(html);

      $('body').append(box);

      // 初始化复制功能
      initCopyFunctionality(box, url);
    }

    $('.article-share-box.on').hide();

    box.css({
      top: offset.top + 25,
      left: offset.left
    }).addClass('on');

    // 自动选中文本，便于复制
    setTimeout(function () {
      box.find('.article-share-input').select();
    }, 100);
  }).on('click', '.article-share-box', function (e) {
    e.stopPropagation();
  }).on('click', '.article-share-box-input', function () {
    $(this).select();
  }).on('click', '.article-share-box-link', function (e) {
    e.preventDefault();
    e.stopPropagation();

    window.open(this.href, 'article-share-box-window-' + Date.now(), 'width=500,height=450');
  });

  // 新增：初始化复制功能
  function initCopyFunctionality(box, url) {
    var copyBtn = box.find('.article-share-copy-btn');
    var copyInput = box.find('.article-share-input');
    var copiedMessage = box.find('.article-share-copied');

    copyBtn.on('click', function (e) {
      e.stopPropagation();
      copyToClipboard(url, copyInput, copiedMessage);
    });

    // 也允许点击输入框复制
    copyInput.on('click', function () {
      $(this).select();
      copyToClipboard(url, copyInput, copiedMessage);
    });
  }

  // 新增：复制到剪贴板的函数（使用现代Clipboard API）
  function copyToClipboard(text, inputElement, successMessage) {
    // 方法1：使用现代的Clipboard API（推荐）
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showCopySuccess(successMessage);
      }).catch(function (err) {
        console.error('复制失败:', err);
        // 失败时回退到旧方法
        fallbackCopyMethod(text, inputElement, successMessage);
      });
    } else {
      // 方法2：回退到旧方法（适用于旧浏览器）
      fallbackCopyMethod(text, inputElement, successMessage);
    }
  }

  // 新增：回退复制方法
  function fallbackCopyMethod(text, inputElement, successMessage) {
    if (inputElement && inputElement.length) {
      inputElement.select();

      try {
        var successful = document.execCommand('copy');
        if (successful) {
          showCopySuccess(successMessage);
        } else {
          console.error('复制命令执行失败');
          showCopyError(successMessage);
        }
      } catch (err) {
        console.error('复制时出错:', err);
        showCopyError(successMessage);
      }
    }
  }

  // 新增：显示复制成功提示
  function showCopySuccess(messageElement) {
    if (messageElement && messageElement.length) {
      messageElement.addClass('copied').text('✓ 链接已复制到剪贴板');

      // 2秒后自动隐藏
      setTimeout(function () {
        messageElement.removeClass('copied');
      }, 2000);
    }
  }

  // 新增：显示复制错误提示
  function showCopyError(messageElement) {
    if (messageElement && messageElement.length) {
      messageElement.addClass('error').text('复制失败，请手动复制');

      // 3秒后自动隐藏
      setTimeout(function () {
        messageElement.removeClass('error');
      }, 3000);
    }
  }


  // Caption
  $('.article-entry').each(function (i) {
    $(this).find('img').each(function () {
      if ($(this).parent().hasClass('fancybox') || $(this).parent().is('a')) return;

      var alt = this.alt;

      if (alt) $(this).after('<span class="caption">' + alt + '</span>');

      $(this).wrap('<a href="' + this.src + '" data-fancybox=\"gallery\" data-caption="' + alt + '"></a>')
    });

    $(this).find('.fancybox').each(function () {
      $(this).attr('rel', 'article' + i);
    });
  });

  if ($.fancybox) {
    $('.fancybox').fancybox();
  }

  // Mobile nav
  var $container = $('#container'),
    isMobileNavAnim = false,
    mobileNavAnimDuration = 200;

  var startMobileNavAnim = function () {
    isMobileNavAnim = true;
  };

  var stopMobileNavAnim = function () {
    setTimeout(function () {
      isMobileNavAnim = false;
    }, mobileNavAnimDuration);
  }

  $('#main-nav-toggle').on('click', function () {
    if (isMobileNavAnim) return;

    startMobileNavAnim();
    $container.toggleClass('mobile-nav-on');
    stopMobileNavAnim();
  });

  $('#wrap').on('click', function () {
    if (isMobileNavAnim || !$container.hasClass('mobile-nav-on')) return;

    $container.removeClass('mobile-nav-on');
  });
})(jQuery);