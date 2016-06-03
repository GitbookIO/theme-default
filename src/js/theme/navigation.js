var $ = require('jquery');
var url = require('url');

var loading = require('./loading');
var platform = require('./platform');

var gitbook = window.gitbook;

var usePushState = (typeof history.pushState !== 'undefined');

/*
    Get current scroller element
*/
function getScroller() {
    if (platform.isMobile()) {
        return $('.book-body');
    } else {
        return $('.body-inner');
    }
}

/*
    Scroll to a specific hash tag in the content
*/
function scrollToHash(hash) {
    var $scroller = getScroller(),
        dest = 0;

    if (hash) {
        dest = getElementTopPosition(hash);
    }

    $scroller.animate({
        scrollTop: dest
    }, 800, 'swing');

    handleScrolling();
}

/*
    Return the top position of an element
 */
function getElementTopPosition(id) {
    // Get actual position of element if nested
    var $scroller  = getScroller(),
        $container = $scroller.find('.page-inner'),
        $el        = $scroller.find(id),
        $parent    = $el.offsetParent(),
        dest       = 0;

    dest = $el.position().top;

    while (!$parent.is($container)) {
        $el = $parent;
        dest += $el.position().top;
        $parent = $el.offsetParent();
    }

    // Return rounded value since
    // jQuery scrollTop() returns an integer
    return Math.floor(dest);
}

/*
    Handle updating summary at scrolling
*/
var $chapters;
function handleScrolling() {
    // Get current page scroll
    var $scroller    = getScroller(),
        scrollTop    = $scroller.scrollTop(),
        scrollHeight = $scroller.prop('scrollHeight'),
        clientHeight = $scroller.prop('clientHeight'),
        nbChapters   = $chapters.length,
        foundChapter = false;

    // Set a chapter as active
    function setChapterActive($chapter) {
        foundChapter = true;

        $chapters.removeClass('active');
        $chapter.addClass('active');
    }

    // Find each title position in reverse order
    $($chapters.get().reverse()).each(function(index) {
        var $link   = $(this).children('a'),
            titleId = $link.attr('href').split('#')[1],
            titleTop;

        if (!!titleId) titleId = '#'+titleId;

        if (!!titleId && !foundChapter) {
            titleTop = getElementTopPosition(titleId);

            // Set current chapter as active if scroller passed it
            if (scrollTop >= titleTop) {
                setChapterActive($(this));
            }
        }
        // If not found at first chapter, set as active
        if (index == (nbChapters - 1) && !foundChapter) {
            setChapterActive($(this));
        }
    });

    // ScrollTop is at 0, set first chapter anyway
    if (!foundChapter && !scrollTop) {
        setChapterActive($chapters.first());
    }

    // Finally, set last chapter at the bottom of page
    if (!!scrollTop && (scrollHeight - scrollTop == clientHeight)) {
        setChapterActive($chapters.last());
    }
}

/*
    Handle a change of url withotu refresh the whole page
*/
var prevUri = location.href;
function handleNavigation(relativeUrl, push) {
    var prevUriParsed = url.parse(prevUri);

    var uri = url.resolve(window.location.pathname, relativeUrl);
    var uriParsed = url.parse(uri);
    var hash = uriParsed.hash;

    // Is it the same url (just hash changed?)
    var pathHasChanged = (uriParsed.pathname !== prevUriParsed.pathname);

    // Is it an absolute url
    var isAbsolute = Boolean(uriParsed.hostname);

    if (!usePushState || isAbsolute) {
        // Refresh the page to the new URL if pushState not supported
        location.href = relativeUrl;
        return;
    }

    // Don't fetch same page
    if (!pathHasChanged) {
        if (push) history.pushState({ path: uri }, null, uri);
        return scrollToHash(hash);
    }

    prevUri = uri;

    return loading.show($.get(uri)
    .then(function (html) {
        // Replace html content
        html = html.replace( /<(\/?)(html|head|body)([^>]*)>/ig, function(a,b,c,d){
            return '<' + b + 'div' + ( b ? '' : ' data-element="' + c + '"' ) + d + '>';
        });

        var $page = $(html);
        var $pageHead = $page.find('[data-element=head]');
        var $pageBody = $page.find('.book');

        // We only use history.pushState for pages generated with GitBook
        if ($pageBody.length === 0) {
            return $.Deferred(function (deferred) {
                var err = new Error('Invalid gitbook page, redirecting...');
                deferred.reject(err);
            }).promise();
        }

        // Push url to history
        if (push) {
            history.pushState({
                path: uri
            }, null, uri);
        }

        // Merge heads
        // !! Warning !!: we only update necessary portions to avoid strange behavior (page flickering etc ...)

        // Update title
        document.title = $pageHead.find('title').text();

        // Reference to $('head');
        var $head = $('head');

        // Update next & prev <link> tags
        // Remove old
        $head.find('link[rel=prev]').remove();
        $head.find('link[rel=next]').remove();

        // Add new next * prev <link> tags
        $head.append($pageHead.find('link[rel=prev]'));
        $head.append($pageHead.find('link[rel=next]'));

        // Merge body
        var bodyClass = $('.book').attr('class');
        var scrollPosition = $('.book-summary').scrollTop();

        $pageBody.toggleClass('with-summary', $('.book').hasClass('with-summary'));

        $('.book').replaceWith($pageBody);
        $('.book').attr('class', bodyClass);
        $('.book-summary').scrollTop(scrollPosition);

        // Update state
        gitbook.state.$book = $('.book');
        preparePage(!hash);

        // Scroll to hashtag position
        if (hash) {
            scrollToHash(hash);
        }
    })
    .fail(function (e) {
        location.href = relativeUrl;
    }));
}

function updateNavigationPosition() {
    var bodyInnerWidth, pageWrapperWidth;

    bodyInnerWidth = parseInt($('.body-inner').css('width'), 10);
    pageWrapperWidth = parseInt($('.page-wrapper').css('width'), 10);
    $('.navigation-next').css('margin-right', (bodyInnerWidth - pageWrapperWidth) + 'px');
}

function preparePage(resetScroll) {
    var $bookBody = $('.book-body');
    var $bookInner = $bookBody.find('.body-inner');
    var $pageWrapper = $bookInner.find('.page-wrapper');

    // Update navigation position
    updateNavigationPosition();

    // Focus on content
    $pageWrapper.focus();

    // Reset scroll
    if (resetScroll !== false) $bookInner.scrollTop(0);
    $bookBody.scrollTop(0);

    // Get current page summary chapters
    $chapters = $('.book-summary .summary .chapter')
    .filter(function() {
        var $link = $(this).children('a'),
            href =  $link.attr('href').split('#')[0];

        var resolvedRef = url.resolve(window.location.pathname, href);

        return window.location.pathname == resolvedRef;
    });

    // Bind scrolling if summary contains more than one link to this page
    var $scroller = getScroller();
    if ($chapters.length > 1) {
        $scroller.scroll(function(e) {
            handleScrolling($chapters);
        });
    }
}

function isLeftClickEvent(e) {
    return e.button === 0;
}

function isModifiedEvent(e) {
    return !!(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey);
}

/*
    Handle click on a link
*/
function handleLinkClick(e) {
    var $this = $(this);
    var target = $this.attr('target');

    if (isModifiedEvent(e) || !isLeftClickEvent(e) || target) {
        return;
    }

    e.stopPropagation();
    e.preventDefault();

    var url = $this.attr('href');
    if (url) handleNavigation(url, true);
}

function goNext() {
    var url = $('.navigation-next').attr('href');
    if (url) handleNavigation(url, true);
}

function goPrev() {
    var url = $('.navigation-prev').attr('href');
    if (url) handleNavigation(url, true);
}


function init() {
    // Prevent cache so that using the back button works
    // See: http://stackoverflow.com/a/15805399/983070
    $.ajaxSetup({
        cache: false
    });

    // Recreate first page when the page loads.
    history.replaceState({ path: window.location.href }, '');

    // Back Button Hijacking :(
    window.onpopstate = function (event) {
        if (event.state === null) {
            return;
        }

        return handleNavigation(event.state.path, false);
    };

    $(document).on('click', '.navigation-prev', handleLinkClick);
    $(document).on('click', '.navigation-next', handleLinkClick);
    $(document).on('click', '.summary [data-path] a', handleLinkClick);
    $(document).on('click', '.page-inner a', handleLinkClick);

    $(window).resize(updateNavigationPosition);

    // Prepare current page
    preparePage();
}

module.exports = {
    init: init,
    goNext: goNext,
    goPrev: goPrev
};
