'use strict';

angular.module('kuro.scroller', ['kuro.draggable']).
    directive('kuroScrollerWrapper', ['$window', '$document', '$timeout', 'KuroDraggable', function ($window, $document, $timeout, Draggable) {
        var computeMouseWheelDelta = function (eventArg) {
            if (eventArg.type == 'DOMMouseScroll' || eventArg.type == 'mousewheel') {
                return (eventArg.wheelDelta) ? eventArg.wheelDelta / 120 : -(eventArg.detail || 0) / 3;
            }
        };

        return {
            link: function (scope, element, attrs, controller) {
                var $wrapper = $(element),
                    $scroller = $wrapper.children('[kuro-scroller]'),
                    modelName = attrs.kuroScrollerModel,
                    watchModelName = attrs.kuroScrollerWatch,
                    options = scope.$eval(attrs.kuroScrollerWrapperOpts) || {},
                    $scrollerBar = $($document[0].createElement('span')).addClass('scroll-bar').appendTo($wrapper),
                    scrollerBarDraggable = new Draggable($scrollerBar),
                    animationOption = {
                        duration: 200,
                        easing: [0, 0, 0.58, 1]
                    },
                    getWrapperHeightEm = function () {
                        return $wrapper.innerHeight() / parseFloat($wrapper.css('font-size'));
                    },
                    getScrollerHeightEm = function () {
                        return $scroller.outerHeight(true) / parseFloat($scroller.css('font-size'));
                    },
                    getscrollerBarHeightEm = function () {
                        return $scrollerBar.outerHeight(true) / parseFloat($scrollerBar.css('font-size'));
                    },
                    computeScrollPercent = function (scrollTop) {
                        return (scrollTop || scope.scrollTop) / (getScrollerHeightEm() - getWrapperHeightEm());    
                    },
                    computescrollerBarHeightPercent = function () {
                        var percent = getWrapperHeightEm() / getScrollerHeightEm();
                        if (percent >= 1) {
                            percent = 0;
                        }
                        return percent;
                    },
                    computescrollerBarStyle = function (scrollTop) {
                        var scrollPercent = computeScrollPercent(scrollTop),
                            scrollerBarHeightPercent = computescrollerBarHeightPercent();

                        return {
                            top: (scrollPercent * 100) + '%',
                            height: (scrollerBarHeightPercent * 100) + '%',
                            translateY: (-scrollPercent * 100) + '%'
                        };
                    },
                    resetscrollerBarStyle = function (scrollTop, doAnimation) {
                        var scrollerBarHeightPercent = computescrollerBarHeightPercent(),
                            animate = function () {
                                $scrollerBar.velocity('stop').velocity(computescrollerBarStyle(scrollTop || scope.scrollTop), doAnimation ? animationOption : {duration: 0});    
                            };

                        if (scrollerBarHeightPercent <= 0) {
                            $scrollerBar.css('display', 'none');
                        } else {
                            $scrollerBar.css('display', 'block');
                        }

                        if (doAnimation !== false && doAnimation !== true) {
                            doAnimation = !$scrollerBar.hasClass('dragging');
                        }

                        if ('mozRequestAnimationFrame' in $window) {
                            $window.requestAnimationFrame(animate);
                        } else {
                            animate();
                        }
                    },
                    scrollTo = function (destScrollTop) {
                        var minScroll = 0,
                            maxScroll = Math.max(0, getScrollerHeightEm() - getWrapperHeightEm()),
                            animate = function () {
                                $scroller.velocity('stop').velocity({
                                    translateY: (-scope[modelName]) + 'em'
                                }, angular.extend(animationOption, {
                                    begin: function () {
                                        $wrapper.addClass('scrolling');
                                    },
                                    complete: function () {
                                        $wrapper.removeClass('scrolling');
                                    }
                                }));                                      
                            };

                        if (destScrollTop < minScroll) {
                            destScrollTop = minScroll;
                        } else if (destScrollTop  > maxScroll) {
                            destScrollTop = maxScroll;
                        }

                        scope[modelName] = destScrollTop;

                        if ('mozRequestAnimationFrame' in $window) {
                            $window.requestAnimationFrame(animate);
                        } else {
                            animate();
                        }
        
                        resetscrollerBarStyle();                        
                    };

                options.speed = options.speed || 8;

                scope[modelName] = 0;

                scope.$watch(modelName, function (newValue, oldValue, scope) {
                    scrollTo(newValue);
                });

                scope.$watch(function () {
                    return $scroller.html();
                }, function (newValue, oldValue, scope) {
                    resetscrollerBarStyle(null, false);
                });

                $wrapper.
                    on('mousewheel DOMMouseScroll', function (e) {
                        var delta = computeMouseWheelDelta(e.originalEvent);
                        scope[modelName] -= delta * options.speed;
                        scrollTo(scope[modelName]);
                    });

                scrollerBarDraggable.dragStart.addListener(function (e) {
                    var $scrollerBar = $(e.currentTarget);

                    $scrollerBar.data('dragStartScrollTop', scope[modelName]).addClass('dragging');
                });

                scrollerBarDraggable.drag.addListener(function (e) {
                    var $scrollerBar = $(e.currentTarget);
                    scope[modelName] = $scrollerBar.data('dragStartScrollTop') + e.deltaY / parseFloat($scrollerBar.css('font-size')) * (getScrollerHeightEm() - getWrapperHeightEm()) / (getWrapperHeightEm() - getscrollerBarHeightEm());    
                    scrollTo(scope[modelName]);
                });

                scrollerBarDraggable.dragEnd.addListener(function (e) {
                    var $scrollerBar = $(e.currentTarget);

                    $scrollerBar.removeClass('dragging');
                });
            }
        };
    }]);