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
            var lastFramePageXY, lastMovePageXY, stepMovedPageXY, lastMoveTime, currentTime, stepTakesTime;
            var vx, vy;
            var target; // 拖动的目标element，非常重要！！！
            var adsorb;
            var touchIdentifier;

            var requestedFrameToken;
            
            // if (e.type === 'touchstart')
            //   touchIdentifier = e.originalEvent.changedTouches[0].identifier;
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
              if (e.which && e.which !== 1) {
                return;
              }
              
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
                if (pageXY.x - lastMovePageXY.x >= stepMovedPageXY.x) {
                  stepMovedPageXY.x = stepMovedPageXY.x * 0.382 + (pageXY.x - lastMovePageXY.x) * 0.618;
                } else {
                  stepMovedPageXY.x = stepMovedPageXY.x * 0.618 + (pageXY.x - lastMovePageXY.x) * 0.382;
                }
                if (pageXY.y - lastMovePageXY.y >= stepMovedPageXY.y) {
                  stepMovedPageXY.y = stepMovedPageXY.y * 0.382 + (pageXY.y - lastMovePageXY.y) * 0.618;
                } else {
                  stepMovedPageXY.y = stepMovedPageXY.y * 0.618 + (pageXY.y - lastMovePageXY.y) * 0.382;
                }
              }

              if (!stepTakesTime) {
                stepTakesTime = currentTime - lastMoveTime;
              } else {
                if (currentTime - lastMoveTime >= stepTakesTime) {
                  stepTakesTime = stepTakesTime * 0.618 + (currentTime - lastMoveTime) * 0.382;
                } else {
                  stepTakesTime = stepTakesTime * 0.382 + (currentTime - lastMoveTime) * 0.618;
                }
                
              }

              vx = (stepMovedPageXY.x) / Math.max(1, stepTakesTime) || 0;
              vy = (stepMovedPageXY.y) / Math.max(1, stepTakesTime) || 0;

              vx *= 1 + Math.abs(vx) / 3;
              vy *= 1 + Math.abs(vy) / 3;

              if (vx > 6)
                vx = 6;
              else if (vx < -6)
                vx = -6

              if (vy > 6)
                vy = 6;
              else if (vy < -6)
                vy = -6;

              $window.cancelAnimationFrame(requestedFrameToken);
              requestedFrameToken = $window.requestAnimationFrame(function () {
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
              });
            }

            function dragend(e) {
              $window.cancelAnimationFrame(requestedFrameToken);

              if (e.type === 'touchend' && e.originalEvent.changedTouches[0].target !== target)
                return;

              var _event;
              if (state === 2) {
                if (e.timeStamp - lastMoveTime > stepTakesTime * 4) {
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