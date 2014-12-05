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
            var lastFramePageXY, lastMovePageXY, lastMoveTime, currentTime, stepTakesTime;
            var vx, vy;
            var target; // 拖动的目标element，非常重要！！！
            var adsorb;
            var touchIdentifier;

            var animationFrameRequested = false;
            
            if (e.type === 'touchstart')
              touchIdentifier = e.originalEvent.changedTouches[0].identifier;
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

              if (e.type === 'touchmove' && e.originalEvent.changedTouches[0].identifier !== touchIdentifier) {
                return;
              }

              lastMovePageXY = pageXY;
              pageXY = getEventPageXY(e);
              lastMoveTime = currentTime;
              currentTime = e.timeStamp;

              if (!stepTakesTime) {
                stepTakesTime = currentTime - lastMoveTime;
              } else {
                stepTakesTime = (stepTakesTime + (currentTime - lastMoveTime)) / 2;
              }

              var newVx = (pageXY.x - lastMovePageXY.x) / Math.max(1, stepTakesTime) || vy || 0;
              var newVy = (pageXY.y - lastMovePageXY.y) / Math.max(1, stepTakesTime) || vy || 0;
              
              if (!vx) {
                vx = newVx;
              } else if (Math.abs(newVx) < Math.abs(vx)) {
                vx = vx * 0.618 + newVx * 0.382;
              } else {
                vx = vx * 0.382 + newVx * 0.618;
              }
              if (!vy) {
                vy = newVy;
              } else if (Math.abs(newVy) < Math.abs(vy)) {
                vy = vy * 0.618 + newVy * 0.382;
              } else {
                vy = vy * 0.382 + newVy * 0.618;
              }

              if (vx > 6)
                vx = 6;
              else if (vx < -6)
                vx = -6

              if (vy > 6)
                vy = 6;
              else if (vy < -6)
                vy = -6;


              if (!animationFrameRequested) {
                $window.requestAnimationFrame(function () {
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

                  animationFrameRequested = false;
                });
                animationFrameRequested = true;
              }
            }

            function dragend(e) {
              if (animationFrameRequested) {
                $window.requestAnimationFrame(_do);
              } else {
                _do();
              }

              function _do() {
                if (e.type === 'touchend' && e.originalEvent.changedTouches[0].identifier !== touchIdentifier)
                  return;

                var _event;
                if (state === 2) {
                  if (e.timeStamp - lastMoveTime > stepTakesTime * 3) {
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
              touch = e.originalEvent.changedTouches[0];  
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