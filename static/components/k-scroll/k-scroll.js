'use strict';

angular.module('kScroll', ['kDrag']).
    directive('kScrollerWrapper', ['$window', '$document', '$timeout', function ($window, $document, $timeout) {
        var computeMouseWheelDelta = function (eventArg) {
            if (eventArg.type == 'DOMMouseScroll' || eventArg.type == 'mousewheel') {
                return (eventArg.wheelDelta) ? eventArg.wheelDelta / 120 : -(eventArg.detail || 0) / 3;
            }
        };

        return {
            scope: {
                model: '=?kModel'
            },
            link: function (scope, element, attrs, controller) {
                var $wrapper = $(element),
                    $scroller = $wrapper.children('[k-scroller]'),
                    $scrollerBar = $($document[0].createElement('span')).addClass('scroll-bar').appendTo($wrapper),
                    animationOption = {
                        duration: 200,
                        easing: [0, 0, 0.58, 1]
                    },
                    minScroll = 0,
                    scrollerHeightRem,
                    wrapperHeightRem,
                    scrollerBarHeightRem,
                    maxScroll,
                    scrollerBarHeightPercent,
                    htmlFontSize,
                    lastFrameTime,
                    requestId,
                    dragEndvScrollTop;

                scope.model = angular.extend({
                    speed: 8,
                    currentScrollTop: 0,
                    vScrollTop: 0
                }, scope.model);

                currentScrollTop = scope.model.currentScrollTop;

                $wrapper
                    .on('mouseenter mousedown touchstart', function () {
                        htmlFontSize = parseFloat($('html').css('font-size'));
                        wrapperHeightRem = $wrapper.innerHeight() / htmlFontSize;
                        scrollerHeightRem = $scroller.outerHeight(true) / htmlFontSize;
                        maxScroll = Math.max(0, scrollerHeightRem - wrapperHeightRem);
                        scrollerBarHeightPercent = wrapperHeightRem / scrollerHeightRem;
                        if (scrollerBarHeightPercent > 1)
                            scrollerBarHeightPercent = 0;
                    })
                    .on('mousewheel DOMMouseScroll', function (e) {
                        var delta = computeMouseWheelDelta(e.originalEvent);
                        var destScrollTop = scope.model.currentScrollTop - delta * scope.model.speed;
                        if (destScrollTop > maxScroll)
                            destScrollTop = maxScroll;
                        else if (destScrollTop < minScroll)
                            destScrollTop = minScroll;
                        scope.model.vScrollTop = 0;
                        scrollTo(destScrollTop, true, true);
                    })
                    .on('mouseenter', function () {
                        resetscrollerBarStyle();
                    })
                    .on('kdragstart', function (e) {
                        if ($(e.target).hasClass('scroll-bar'))
                            return;

                        var $wrapper = $(e.currentTarget);
                        if (!$wrapper.hasClass('dragging')) {
                            $wrapper.addClass('dragging');
                        }
                    })
                    .on('kdrag', function (e) {
                        if (!$wrapper.hasClass('dragging'))
                            return;

                        if (scope.model.currentScrollTop > maxScroll) {
                            e.stepY /= 1 + Math.abs(scope.model.currentScrollTop - maxScroll) * 2;
                        } else if (scope.model.currentScrollTop < minScroll) {
                            e.stepY /= 1 + Math.abs(scope.model.currentScrollTop - minScroll) * 2;
                        }

                        scope.model.vScrollTop = -e.vy / parseFloat(htmlFontSize);
                        scope.model.currentScrollTop -= e.stepY / parseFloat(htmlFontSize);
                        scrollTo(scope.model.currentScrollTop, false, false);
                    })
                    .on('kdragend', function (e) {
                        var $wrapper = $(e.currentTarget);
            
                        if (!$wrapper.hasClass('dragging'))
                            return;

                        $wrapper.removeClass('dragging');
                        
                        dragEndvScrollTop = scope.model.vScrollTop = -e.vy / parseFloat(htmlFontSize);

                        lastFrameTime = null;
                        $wrapper.addClass('sliding');
                        slide();
                    })
                    .on('mousedown touchstart', function (e) {
                        if (requestId) {
                            window.cancelAnimationFrame(requestId);
                            requestId = null;
                            $document.data('tapPrevented', true);
                        }
                        vScrollTop = 0;
                        $wrapper.removeClass('sliding');
                    });

                $scrollerBar
                    .on('kdragstart', function (e) {
                        var $scrollerBar = $(e.currentTarget);
                        scrollerBarHeightRem = $scrollerBar.outerHeight(true) / htmlFontSize;
                        $scrollerBar.data('dragStartScrollTop', scope.model.currentScrollTop).addClass('dragging');
                    })
                    .on('kdrag', function (e) {
                        var $scrollerBar = $(e.currentTarget);
                        var destScrollTop = $scrollerBar.data('dragStartScrollTop') + e.deltaY / htmlFontSize * (scrollerHeightRem - wrapperHeightRem) / (wrapperHeightRem - scrollerBarHeightRem)
                        if (destScrollTop > maxScroll)
                            destScrollTop = maxScroll;
                        else if (destScrollTop < minScroll)
                            destScrollTop = minScroll;
                        scrollTo(destScrollTop, false, false);
                    })
                    .on('kdragend', function (e) {
                        var $scrollerBar = $(e.currentTarget);
                        $scrollerBar.removeClass('dragging');
                    });

                $.Velocity.hook($scrollerBar, "translateZ", 0);
                $.Velocity.hook($scroller, "translateZ", 0);
                scrollTo(scope.model.currentScrollTop, false, false);

                function slide(time) {
                    var timeSpan, destScrollTop;

                    if (lastFrameTime) {
                        timeSpan = time - lastFrameTime;
                        destScrollTop = scope.model.currentScrollTop + scope.model.vScrollTop * timeSpan;

                        scrollTo(destScrollTop, false, false);

                        scope.model.vScrollTop *= Math.pow(0.97, timeSpan / 17);

                        if (scope.model.currentScrollTop > maxScroll) {
                            if (scope.model.vScrollTop <= 0) {
                                scope.model.vScrollTop = (maxScroll - scope.model.currentScrollTop) / 150;
                                if (dragEndvScrollTop < 0 && scope.model.vScrollTop > dragEndvScrollTop) {
                                    scope.model.vScrollTop = dragEndvScrollTop;
                                } else if (scope.model.vScrollTop > -0.002) {
                                    scope.model.vScrollTop = -0.002;
                                }
                            } else {
                                scope.model.vScrollTop -= (scope.model.currentScrollTop - maxScroll) * 0.002 * timeSpan;
                                if (scope.model.vScrollTop < 0) {
                                    scope.model.vScrollTop = 0;
                                }
                            }
                        } else if (scope.model.currentScrollTop < minScroll) {
                            if (scope.model.vScrollTop >= 0) {
                                scope.model.vScrollTop = (minScroll - scope.model.currentScrollTop) / 150;
                                if (dragEndvScrollTop > 0 && scope.model.vScrollTop < dragEndvScrollTop) {
                                    scope.model.vScrollTop = dragEndvScrollTop;
                                } else if (scope.model.vScrollTop < 0.002) {
                                    scope.model.vScrollTop = 0.002;
                                }
                            } else {
                                scope.model.vScrollTop -= (scope.model.currentScrollTop - minScroll) * 0.002 * timeSpan;
                                if (scope.model.vScrollTop > 0) {
                                    scope.model.vScrollTop = 0
                                }
                            }
                        }
                    }

                    lastFrameTime = time;

                    if (Math.abs(scope.model.currentScrollTop - maxScroll) < 0.03) {
                        scope.model.currentScrollTop = maxScroll;
                    } else if (Math.abs(scope.model.currentScrollTop - minScroll) < 0.03) {
                        scope.model.currentScrollTop = minScroll;
                    }

                    if (!$wrapper.hasClass('dragging')
                    && (Math.abs(scope.model.vScrollTop) > 0.002
                    || scope.model.currentScrollTop > maxScroll
                    || scope.model.currentScrollTop < minScroll)) {
                        requestId = window.requestAnimationFrame(slide);
                    } else {
                        scope.model.vScrollTop = 0;
                        $wrapper.removeClass('sliding');
                        requestId = null;
                    }
                }

                function resetscrollerBarStyle (currentScrollTop, doAnimation) {
                    var scrollPercent = (currentScrollTop || scope.model.currentScrollTop) / (scrollerHeightRem - wrapperHeightRem);

                    if (scrollerBarHeightPercent <= 0) {
                        $scrollerBar.css('display', 'none');
                    } else {
                        $scrollerBar.css('display', 'block');
                    }

                    var style = {
                        top: (scrollPercent * 100) + '%',
                        height: (scrollerBarHeightPercent * 100) + '%',
                        translateY: (-scrollPercent * 100) + '%'
                    }, key;

                    if (doAnimation) {
                        $scrollerBar
                            .velocity('stop')
                            .velocity(style, animationOption);
                    } else {
                        for (key in style) {
                            $.Velocity.hook($scrollerBar, key, style[key]);
                        }
                    }
                }

                function scrollTo (destScrollTop, doAnimation, scrollerBarDoAnimation) {
                    scope.model.currentScrollTop = destScrollTop;

                    if (doAnimation) {
                        $scroller.velocity('stop').velocity({
                            translateY: (-scope.model.currentScrollTop) + 'rem'
                        }, angular.extend(animationOption, {
                            begin: function () {
                                $wrapper.addClass('scrolling');
                            },
                            complete: function () {
                                $wrapper.removeClass('scrolling');
                            }
                        }));  
                    } else {
                        $.Velocity.hook($scroller, "translateY", -scope.model.currentScrollTop + 'rem');
                    }
                
                    resetscrollerBarStyle(null, scrollerBarDoAnimation);                        
                };
            }
        };
    }]);