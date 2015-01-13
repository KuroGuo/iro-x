;(function (angular) { 'use strict';
  angular.module('kScroll', ['kTap', 'kDrag']).
    directive('kScrollerWrapper', ['$window', '$document', '$timeout', 'kDrag',
    function ($window, $document, $timeout, kDrag) {
      return {
        restrict: 'C',
        scope: {
          model: '=?kModel'
        },
        link: function (scope, element, attrs, controller) {
          var $wrapper = element,
            wrapper = $wrapper[0],
            $scroller = $wrapper.children('.k-scroller'),
            $scrollerBar = $($document[0].createElement('span')).addClass('scroll-bar hoverable activable').appendTo($wrapper),
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
            frameToken,
            dragEndvScrollTop,
            $pullDownHint,
            $pullUpHint,
            $pullDownHintText,
            $pullUpHintText,
            isDrag;

          scope.model = angular.extend({
            speed: 7, // 鼠标滚轮滚动速度
            currentScrollTop: 0, // 当前纵向滚动值
            vScrollTop: 0, // 纵向滚动速度
            mouseDrag: true, // 是否允许鼠标拖动
            usePullDown: false, // 是否使用下拉，可实现下拉刷新等功能
            usePullUp: false, // 是否使用上拉，可实现上拉加载更多等功能
            resizeCheck: true, // 浏览器窗口尺寸变化时检查,
            emitDragstart: false,
            emitDragend: false,
            bindKey: true // 绑定按键
          }, scope.model);

          scope.model.pullDownState = null;
          scope.model.pullUpState = null;

          scope.model.scrollTo = scrollTo;
          scope.model.stopAnimation = stopAnimation;
          scope.model.refreshContext = refreshContext;
          scope.model.resetscrollerBarStyle = resetscrollerBarStyle;
          scope.model.setPullDownHintText = setPullDownHintText;
          scope.model.setPullUpHintText = setPullUpHintText;

          Object.defineProperty(scope.model, 'maxScroll', {
            get: function () {
              return maxScroll;
            }
          });

          if (scope.model.usePullDown) {
            $pullDownHint = $('<div class="pulldown-hint"><span class="content"><span class="text"></span></span></div>');
            $scroller.prepend($pullDownHint);
            $pullDownHintText = $pullDownHint.find('.text');
          }
          if (scope.model.usePullUp) {
            $pullUpHint = $('<div class="pullup-hint"><span class="content"><span class="text"></span></span></div>');
            $scroller.append($pullUpHint);
            $pullUpHintText = $pullUpHint.find('.text');
          }

          kDrag.bind($wrapper);
          kDrag.bind($scrollerBar);

          wrapper.addEventListener('mouseenter', refreshContext);
          wrapper.addEventListener('mousedown', refreshContext);
          wrapper.addEventListener('touchstart', refreshContext);

          wrapper.addEventListener('mouseenter', function () {
            resetscrollerBarStyle();
          });

          wrapper.addEventListener('mousedown', _break);
          wrapper.addEventListener('touchstart', _break);

          $window.addEventListener('blur', _break);
          $wrapper.on('$destroy', function () {
            $window.removeEventListener('blur', _break);
          });

          $wrapper
            .on('mousewheel DOMMouseScroll', function (e) {
              if (e.ctrlKey)
                return;
              refreshContext();
              e.preventDefault();
              var delta = computeMouseWheelDelta(e.originalEvent);
              var destScrollTop = scope.model.currentScrollTop - delta * scope.model.speed;
              if (destScrollTop > maxScroll)
                destScrollTop = maxScroll;
              else if (destScrollTop < minScroll)
                destScrollTop = minScroll;
              scope.model.vScrollTop = 0;
              scrollTo(destScrollTop, true, true);
            })
            .on('touchstart mousedown', function (e) {
              isDrag = false;
            })
            .on('kdragstart', function (e) {
              if ($(e.target).hasClass('scroll-bar')) // 如果拖拽的是滚动条就返回
                return;
              else if (!scope.model.mouseDrag && e.pointerType === 'mouse' && !e.ctrlKey) {
                e.prevent();
                return;
              }

              var $wrapper = $(e.currentTarget);

              if (scope.model.emitDragstart) {
                scope.$emit('kScrollerDragstart', e);
              }

              if (e.state > 0) {
                $wrapper.addClass('dragging');
                isDrag = true;
              }
            })
            .on('kdrag', function (e) {
              if ($(e.target).hasClass('scroll-bar'))
                return;

              if (scope.model.currentScrollTop > maxScroll) {
                if (e.vy <= 0) {
                  e.stepY /= 1 + Math.abs(scope.model.currentScrollTop - maxScroll);
                }
              } else if (scope.model.currentScrollTop < minScroll) {
                if (e.vy >= 0) {
                  e.stepY /= 1 + Math.abs(scope.model.currentScrollTop - minScroll);
                }
              }

              scope.model.vScrollTop = -e.vy / parseFloat(htmlFontSize);
              scope.model.currentScrollTop -= e.stepY / parseFloat(htmlFontSize);
              scrollTo(scope.model.currentScrollTop, false, false);

              checkPullStateChange();
            })
            .on('mouseup touchend touchcancel', function (e) {
              var $wrapper = $(e.currentTarget);

              if (!isDrag) {
                dragEndvScrollTop = 0;
                lastFrameTime = null;
                $wrapper.addClass('sliding');
                slide();
                checkTriggerPull();
              }
            })
            .on('kdragend', function (e) {
              if ($(e.target).hasClass('scroll-bar'))
                return;

              var $wrapper = $(e.currentTarget);

              $wrapper.removeClass('dragging');
              
              dragEndvScrollTop = scope.model.vScrollTop = -e.vy / parseFloat(htmlFontSize);

              lastFrameTime = null;
              $wrapper.addClass('sliding');
              slide();

              checkTriggerPull();

              if (scope.model.emitDragend) {
                scope.$emit('kScrollerDragend', e);
              }
            });

          $scrollerBar
            .on('touchstart, mousedown', function (e) {
              e.preventDefault();
            })
            .on('kdragstart', function (e) {
              var $scrollerBar = $(e.currentTarget);
              refreshContext();
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

          $window.addEventListener('resize', resizeCheck);
          $wrapper.on('$destroy', function () {
            $window.removeEventListener('resize', resizeCheck);
          });

          document.addEventListener('keydown', keyScroll);
          $wrapper.on('$destroy', function () {
            document.removeEventListener('keydown', keyScroll);
          });

          // 强制开启硬件加速
          $.Velocity.hook($scroller, "translateZ", '1px');
          $.Velocity.hook($scrollerBar, "translateZ", '1px');
          scrollTo(scope.model.currentScrollTop, false, false);

          function keyScroll(e) {
            if (!scope.model.bindKey)
              return;

            // ←:37  ↑:38  →:39  ↓:40  pgup:33  pgdn:34
            switch (e.keyCode) {
              case 33:
                scope.model.currentScrollTop -= wrapperHeightRem - 3;
                break;
              case 34:
                scope.model.currentScrollTop += wrapperHeightRem - 3;
                break;
              case 38:
                scope.model.currentScrollTop -= scope.model.speed;
                break;
              case 40:
                scope.model.currentScrollTop += scope.model.speed;
                break;
              default:
                return;
            }

            refreshContext();

            if (scope.model.currentScrollTop < minScroll)
              scope.model.currentScrollTop = minScroll;
            else if (scope.model.currentScrollTop > maxScroll)
              scope.model.currentScrollTop = maxScroll;

            scrollTo(scope.model.currentScrollTop, true, true);
          }

          function resizeCheck() {
            if (!scope.model.resizeCheck)
              return;

            if ($wrapper.css('display') === 'none')
              return;

            refreshContext();
            if (scope.model.currentScrollTop > maxScroll) {
              scrollTo(maxScroll);
            }
          }

          function _break(e, preventTap) {
            if (frameToken) {
              stopAnimation();
              if (e.type !== 'blur' && Math.abs(scope.model.vScrollTop) > 0.01) {
                e.stopPropagation();
                e.preventDefault();
              }
            }
            scope.model.vScrollTop = 0;
            $wrapper.removeClass('sliding');

            if (e.ctrlKey && e.type === 'mousedown') {
              e.preventDefault();
            }
          }

          function checkPullStateChange() {
            var currentPullDownState = scope.model.pullDownState;
            var currentPullUpState = scope.model.pullUpState;
            var currentScrollTop = scope.model.currentScrollTop;
            if (scope.model.usePullDown && currentScrollTop < -4 && (!scope.model.pullDownState || scope.model.pullDownState === 1 || scope.model.pullDownState === 4)) {
              scope.model.pullDownState = 1;
            } else if (scope.model.usePullUp && currentScrollTop > maxScroll + 4 && (!scope.model.pullUpState || scope.model.pullUpState === 1 || scope.model.pullUpState === 4)) {
              scope.model.pullUpState = 1;
            } else {
              scope.model.pullDownState = 0;
              scope.model.pullUpState = 0;
            }
            if (currentPullDownState !== scope.model.pullDownState) {
              scope.$emit('kScrollerPullDownStateChange');
            }
            if (currentPullUpState !== scope.model.pullUpState) {
              scope.$emit('kScrollerPullUpStateChange');
            }
          }

          function checkTriggerPull() {
            var currentScrollTop = scope.model.currentScrollTop;
            if (scope.model.usePullDown && currentScrollTop < -4 && scope.model.pullDownState < 2) {
              scope.model.pullDownState = 2;
              scope.$emit('kScrollerPullDownStateChange');
              scrollTo(-4, true, true, 250, function () {
                scope.$emit('kScrollerPullDown');

              });
            } else if (scope.model.usePullUp && currentScrollTop > scope.model.maxScroll + 4 && scope.model.pullUpState < 2) {
              scope.model.pullUpState = 2;
              scope.$emit('kScrollerPullUpStateChange');
              scrollTo(maxScroll + 4, true, true, 250, function () {
                scope.$emit('kScrollerPullUp');
              });
            }
          }

          function refreshContext() {
            htmlFontSize = parseFloat($('html').css('font-size'));
            wrapperHeightRem = $wrapper.innerHeight() / htmlFontSize;
            scrollerHeightRem = $scroller.outerHeight(true) / htmlFontSize;
            maxScroll = Math.max(0, scrollerHeightRem - wrapperHeightRem);
            scrollerBarHeightPercent = wrapperHeightRem / scrollerHeightRem;
            if (scrollerBarHeightPercent >= 1) {
              scrollerBarHeightPercent = 0;
            }

            scrollerBarHeightRem = Math.max(wrapperHeightRem * scrollerBarHeightPercent, 4);
          }

          function slide(time) {
            var timeSpan, destScrollTop, vScrollTopCurrent;

            if (lastFrameTime) {
              timeSpan = time - lastFrameTime;

              vScrollTopCurrent = scope.model.vScrollTop * Math.pow(0.95, timeSpan / (1000 / 60));

              destScrollTop = scope.model.currentScrollTop + (scope.model.vScrollTop + vScrollTopCurrent) / 2 * timeSpan;

              scrollTo(destScrollTop, false, false);

              scope.model.vScrollTop = vScrollTopCurrent;

              if (scope.model.currentScrollTop > maxScroll) {
                if (scope.model.vScrollTop <= 0) {
                  scope.model.vScrollTop = (maxScroll - scope.model.currentScrollTop) / 200;
                  if (dragEndvScrollTop < 0 && scope.model.vScrollTop > dragEndvScrollTop) {
                    scope.model.vScrollTop = dragEndvScrollTop;
                  } else if (scope.model.vScrollTop > -0.002) {
                    scope.model.vScrollTop = -0.002;
                  }
                } else {
                  scope.model.vScrollTop -= (scope.model.currentScrollTop - maxScroll) * 0.001 * timeSpan;
                  if (scope.model.vScrollTop < 0) {
                    scope.model.vScrollTop = 0;
                  }
                }
              } else if (scope.model.currentScrollTop < minScroll) {
                if (scope.model.vScrollTop >= 0) {
                  scope.model.vScrollTop = (minScroll - scope.model.currentScrollTop) / 200;
                  if (dragEndvScrollTop > 0 && scope.model.vScrollTop < dragEndvScrollTop) {
                    scope.model.vScrollTop = dragEndvScrollTop;
                  } else if (scope.model.vScrollTop < 0.002) {
                    scope.model.vScrollTop = 0.002;
                  }
                } else {
                  scope.model.vScrollTop -= (scope.model.currentScrollTop - minScroll) * 0.001 * timeSpan;
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
              frameToken = window.requestAnimationFrame(slide);
            } else {
              scope.model.vScrollTop = 0;
              $wrapper.removeClass('sliding');
              window.cancelAnimationFrame(frameToken);
              frameToken = null;
            }
          }

          function resetscrollerBarStyle(currentScrollTop, doAnimation) {
            var scrollPercent = (currentScrollTop || scope.model.currentScrollTop) / (scrollerHeightRem - wrapperHeightRem);

            if (scrollerBarHeightPercent <= 0) {
              $scrollerBar.css('display', 'none');
            } else {
              $scrollerBar.css('display', 'block');
            }

            $.Velocity.hook($scrollerBar, 'height', scrollerBarHeightRem + 'rem');

            $scrollerBar.velocity('stop');

            var translateY = ((wrapperHeightRem - scrollerBarHeightRem) * scrollPercent) + 'rem';

            if (doAnimation) {
              $scrollerBar.velocity({translateY: translateY}, animationOption);
            } else {
              $.Velocity.hook($scrollerBar, 'translateY', translateY);
            }
          }

          function scrollTo(destScrollTop, doAnimation, scrollerBarDoAnimation, duration, callback) {
            scope.model.currentScrollTop = destScrollTop;

            stopAnimation();

            if (doAnimation) {
              $scroller.velocity({
                translateY: (-scope.model.currentScrollTop) + 'rem'
              }, angular.extend(JSON.parse(JSON.stringify(animationOption)), {
                begin: function () {
                  $wrapper.addClass('scrolling');
                },
                complete: function () {
                  $wrapper.removeClass('scrolling');
                  if (typeof callback === 'function')
                    callback.call(this);
                },
                duration: duration || animationOption.duration
              }));  
            } else {
              $.Velocity.hook($scroller, "translateY", -scope.model.currentScrollTop + 'rem');
              if (typeof callback === 'function')
                callback.call(this);
            }
          
            resetscrollerBarStyle(null, scrollerBarDoAnimation);                        
          }

          function stopAnimation() {
            $window.cancelAnimationFrame(frameToken);
            frameToken = null;
            $scroller.velocity('stop');
          }

          function setPullDownHintText(text) {
            $pullDownHintText.html(text);
          }
          function setPullUpHintText(text) {
            $pullUpHintText.html(text);
          }
        }
      };

      function computeMouseWheelDelta(eventArg) {
        if (eventArg.type == 'DOMMouseScroll' || eventArg.type == 'mousewheel') {
          return (eventArg.wheelDelta) ? eventArg.wheelDelta / 120 : -(eventArg.detail || 0) / 3;
        }
      };
    }]);
})(angular);