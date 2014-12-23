;(function (angular) { 'use strict';
  angular.module('kDrag', [])
    .directive('html', ['$document', '$window', function ($document, $window) {
      return {
        restrict: 'E',
        link: function (scope, element, attrs, controller) {
          $document
            .on('mousedown touchstart', dragStart);

          function dragStart(e) {
            var state = 0; // 0: 初始状态, 1: 按下, 2: dragging
            var pointerdownPageXY; // 按下时的PageXY
            var pageXY; // 拖动时和拖动结束时的PageXY
            var lastFramePageXY, lastMovePageXY, lastFrameTime, frameTakesTime, stepMovedPageXY, lastMoveTime, currentTime, stepTakesTime;
            var vx, vy;
            var target; // 拖动的目标element，非常重要！！！
            var adsorb;

            var requestedFrameToken;
            
            if (e.which && e.which !== 1) {
              return;
            }
            
            lastFramePageXY = pageXY = pointerdownPageXY = getEventPageXY(e);
            lastMoveTime = e.timeStamp;
            target = e.target;
            adsorb = parseFloat($(target).attr('k-drag-adsorb')) || 0;
            state = 1;

            $document
              .on('mousemove touchmove', drag)
              .on('mouseup touchend touchcancel', dragend);

            $($window).on('blur', dragend);

            function drag(e) {          
              if (state < 1) {
                return;
              }

              if (e.type === 'touchmove' && e.originalEvent.targetTouches[0].target !== target) {
                return;
              }

              lastMovePageXY = pageXY;
              pageXY = getEventPageXY(e);
              lastMoveTime = currentTime;
              currentTime = e.timeStamp;

              if (!stepMovedPageXY) {
                stepMovedPageXY = {
                  x: pageXY.x - lastMovePageXY.x,
                  y: pageXY.y - lastMovePageXY.y
                };
              } else {
                stepMovedPageXY.x = (stepMovedPageXY.x + pageXY.x - lastMovePageXY.x) / 2;
                stepMovedPageXY.y = (stepMovedPageXY.y + pageXY.y - lastMovePageXY.y) / 2;
              }

              if (!stepTakesTime) {
                stepTakesTime = currentTime - lastMoveTime;
              } else {
                stepTakesTime = (stepTakesTime + currentTime - lastMoveTime) / 2;
              }

              vx = (stepMovedPageXY.x) / Math.max(1, stepTakesTime) || 0;
              vy = (stepMovedPageXY.y) / Math.max(1, stepTakesTime) || 0;

              // if (vx > 1) {
              //   vx += 1;
              // } else if (vx < -1) {
              //   vx -= 1;
              // }
              // if (vy > 1) {
              //   vy += 1;
              // } else if (vy < -1) {
              //   vy -= 1;
              // }

              // vx *= 1 + Math.abs(vx) / 2;
              // vy *= 1 + Math.abs(vy) / 2;

              if (vx > 5)
                vx = 5;
              else if (vx < -5)
                vx = -5

              if (vy > 5)
                vy = 5;
              else if (vy < -5)
                vy = -5;

              $window.cancelAnimationFrame(requestedFrameToken);
              requestedFrameToken = $window.requestAnimationFrame(function (time) {
                var _event;

                if (state === 1) {
                  if (Math.abs(pageXY.x - pointerdownPageXY.x) >= adsorb
                  || Math.abs(pageXY.y - pointerdownPageXY.y) >= adsorb) {
                    _event = newEvent('kdragstart', e);
                    state = 2;
                    $(target).trigger(_event);
                  }
                }

                if (state === 2) {
                  _event = newEvent('kdrag', e);
                  $(target).trigger(_event);
                }

                lastFramePageXY = pageXY;
                if (lastFrameTime) {
                  if (!frameTakesTime) {
                    frameTakesTime = time - lastFrameTime;  
                  } else {
                    frameTakesTime = (frameTakesTime + time - lastFrameTime) / 2;
                  }
                }
                lastFrameTime = time;
              });
            }

            function dragend(e) {
              $window.cancelAnimationFrame(requestedFrameToken);

              if (e && e.type === 'touchend' && e.originalEvent.changedTouches[0].target !== target)
                return;

              var _event;
              if (state === 2) {
                if (e.timeStamp - lastMoveTime > (frameTakesTime * 6 || 100)) {
                  vx = 0;
                  vy = 0;
                }

                _event = newEvent('kdragend', e);
                $(target).trigger(_event);
              }
              state = 0;

              $document
                .off('mousemove touchmove', drag)
                .off('mouseup touchend', dragend);
              $($window).off('blur', dragend);
            }

            function newEvent(name, e) {
              var _event = $.Event(name);

              pageXY = getEventPageXY(e);

              _event.pageX = pageXY.x || -1;
              _event.pageY = pageXY.y || -1;
              _event.deltaX = (pageXY.x - pointerdownPageXY.x) || -1;
              _event.deltaY = (pageXY.y - pointerdownPageXY.y) || -1;
              _event.stepX = pageXY.x - lastFramePageXY.x;
              _event.stepY = pageXY.y - lastFramePageXY.y;
              _event.vx = vx || 0;
              _event.vy = vy || 0;

              if (e.type.indexOf('mouse') > -1) {
                _event.pointerType = 'mouse';
              } else if (e.type.indexOf('touch') > -1) {
                _event.pointerType = 'touch';
                _event.touchId = e.originalEvent.changedTouches[0].identifier;
              } else {
                _event.pointerType = e.type;
              }
              _event.preventDefault = function () {
                e.preventDefault();
              };
              _event.prevent = function () {
                state = 0;
                dragend();
              };
              _event.ctrlKey = e.ctrlKey;

              return _event;
            }
          }

          function getEventPageXY(e) {
            var touch, pageX, pageY;

            if (e.type.indexOf("touch") > -1) {
              if (e.type === 'touchmove') {
                touch = e.originalEvent.targetTouches[0];
              } else {
                touch = e.originalEvent.changedTouches[0];  
              }
              pageX = touch.pageX;
              pageY = touch.pageY;
            } else {
              pageX = e.pageX;
              pageY = e.pageY;
            }

            return {x: pageX, y: pageY};
          }
        }
      };
    }]);
})(angular);