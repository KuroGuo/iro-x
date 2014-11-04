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
                    scrollerHeightEm,
                    wrapperHeightEm,
                    scrollerBarHeightEm,
                    maxScroll,
                    scrollerBarHeightPercent,
                    wrapperFontSize ,
                    scrollerFontSize,
                    scrollerBarFontSize,
                    vy,
                    lastStepTime;

                if (!scope.model) {
                    scope.model = {
                        speed: 8,
                        currentScrollTop: 0
                    };    
                }

                $wrapper
                    .on('mouseenter mousedown touchstart', function () {
                        wrapperFontSize = parseFloat($wrapper.css('font-size'));
                        scrollerFontSize = parseFloat($scroller.css('font-size'));
                        scrollerBarFontSize = parseFloat($scrollerBar.css('font-size'));
                        wrapperHeightEm = $wrapper.innerHeight() / wrapperFontSize;
                        scrollerHeightEm = $scroller.outerHeight(true) / scrollerFontSize;
                        maxScroll = Math.max(0, scrollerHeightEm - wrapperHeightEm);
                        scrollerBarHeightPercent = wrapperHeightEm / scrollerHeightEm;
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
                        vy = 0;
                        scrollTo(destScrollTop, true, true);
                    })
                    .on('mouseenter', function () {
                        resetscrollerBarStyle();
                    })
                    .on('kdragstart', function (e) {
                        if ($(e.target).is('.scroll-bar'))
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
                            e.stepY /= 1 + Math.abs(scope.model.currentScrollTop - maxScroll);
                        } else if (scope.model.currentScrollTop < minScroll) {
                            e.stepY /= 1 + Math.abs(scope.model.currentScrollTop - minScroll);
                        }
                        scrollTo(scope.model.currentScrollTop - e.stepY / parseFloat(wrapperFontSize), false, false);
                    })
                    .on('kdragend', function (e) {                    
                        var $wrapper = $(e.currentTarget);
            
                        if (!$wrapper.hasClass('dragging'))
                            return;

                        $wrapper.removeClass('dragging');
                        
                        if (!vy) {
                            vy = e.vy;
                            lastStepTime = null;
                            $wrapper.addClass('sliding');
                            slide(0);
                        }
                    })
                    .on('mousedown touchstart', function () {
                        vy = 0;
                    });

                $scrollerBar
                    .on('kdragstart', function (e) {
                        var $scrollerBar = $(e.currentTarget);
                        scrollerBarHeightEm = $scrollerBar.outerHeight(true) / scrollerBarFontSize;
                        $scrollerBar.data('dragStartScrollTop', scope.model.currentScrollTop).addClass('dragging');
                    })
                    .on('kdrag', function (e) {
                        var $scrollerBar = $(e.currentTarget);
                        var destScrollTop = $scrollerBar.data('dragStartScrollTop') + e.deltaY / scrollerBarFontSize * (scrollerHeightEm - wrapperHeightEm) / (wrapperHeightEm - scrollerBarHeightEm)
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

                function slide(time) {
                    var timeSpan, destScrollTop;

                    if (lastStepTime) {
                        timeSpan = time - lastStepTime;
                        destScrollTop = scope.model.currentScrollTop - vy * timeSpan / wrapperFontSize;

                        scrollTo(destScrollTop, false, false);

                        vy *= 0.96;

                        if (scope.model.currentScrollTop > maxScroll) {
                            if (vy > 0) {
                                vy = (scope.model.currentScrollTop - maxScroll) * wrapperFontSize / 150;
                                if (vy < 0.03) {
                                    vy = 0.03;
                                }
                            } else {
                                vy += (scope.model.currentScrollTop - maxScroll) * 0.005 * timeSpan;
                            }
                        } else if (scope.model.currentScrollTop < minScroll) {
                            if (vy < 0) {
                                vy = (scope.model.currentScrollTop - minScroll) * wrapperFontSize / 150;
                                 if (vy > -0.03) {
                                    vy = -0.03;
                                }
                            } else {
                                vy += (scope.model.currentScrollTop - minScroll) * 0.005 * timeSpan;
                            }
                        }
                    }

                    lastStepTime = time;

                    if (Math.abs(scope.model.currentScrollTop - maxScroll) < 0.03) {
                        scope.model.currentScrollTop = maxScroll;
                    } else if (Math.abs(scope.model.currentScrollTop - minScroll) < 0.03) {
                        scope.model.currentScrollTop = minScroll;
                    }

                    if (!$wrapper.hasClass('dragging')
                    && (Math.abs(vy) > 0.03
                    || scope.model.currentScrollTop > maxScroll
                    || scope.model.currentScrollTop < minScroll)) {
                        window.requestAnimationFrame(slide);
                    } else {
                        vy = 0;
                        $wrapper.removeClass('sliding');
                    }
                }

                function resetscrollerBarStyle (currentScrollTop, doAnimation) {
                    var scrollPercent = (currentScrollTop || scope.model.currentScrollTop) / (scrollerHeightEm - wrapperHeightEm);

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
                            translateY: (-scope.model.currentScrollTop) + 'em'
                        }, angular.extend(animationOption, {
                            begin: function () {
                                $wrapper.addClass('scrolling');
                            },
                            complete: function () {
                                $wrapper.removeClass('scrolling');
                            }
                        }));  
                    } else {
                        $.Velocity.hook($scroller, "translateY", -scope.model.currentScrollTop + 'em');
                    }
                
                    resetscrollerBarStyle(null, scrollerBarDoAnimation);                        
                };
            }
        };
    }]);