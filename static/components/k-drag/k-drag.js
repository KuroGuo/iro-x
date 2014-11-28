;(function (angular) { 'use strict';
  angular.module('kDrag', [])
    .directive('html', ['$document', '$window', function ($document, $window) {
      return {
        restrict: 'E',
        link: function (scope, element, attrs, controller) {
          var state = 0; // 0: 初始状态, 1: 按下, 2: dragging
          var pointerdownPageXY; // 按下时的PageXY
          var pageXY; // 拖动时和拖动结束时的PageXY
          var lastFramePageXY, lastMovePageXY, lastMoveTime, currentTime;
          var vx, vy;
          var target; // 拖动的目标element，非常重要！！！
          var adsorb;

          var animationFrameRequested = false;

          $document
            .on('mousedown touchstart', function (e) {
              lastFramePageXY = pageXY = pointerdownPageXY = getEventPageXY(e);
              lastMoveTime = e.timeStamp;
              target = e.target;
              adsorb = parseFloat($(target).attr('k-drag-adsorb')) || 0;
              state = 1;
            })
            .on('mousemove touchmove', function (e) {
              if (e.which && e.which !== 1) {
                return;
              }
              
              if (state < 1) {
                return;
              }

              lastMovePageXY = pageXY;
              pageXY = getEventPageXY(e);
              lastMoveTime = currentTime;
              currentTime = e.timeStamp;

              var newVx = (pageXY.x - lastMovePageXY.x) / Math.max(1, currentTime - lastMoveTime) || vy || 0;
              var newVy = (pageXY.y - lastMovePageXY.y) / Math.max(1, currentTime - lastMoveTime) || vy || 0;
              if (Math.abs(newVx) < Math.abs(vx)) {
                vx = vx * 0.618 + newVx * 0.382;
              } else {
                vx = newVx;
              }
              if (Math.abs(newVy) < Math.abs(vy)) {
                vy = vy * 0.618 + newVy * 0.382;
              } else {
                vy = newVy;
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
            })
            .on('mouseup touchend', cancelDrag);

          $($window).on('blur', cancelDrag);

          function cancelDrag(e) {
            if (animationFrameRequested) {
              $window.requestAnimationFrame(_do);
            } else {
              _do();
            }

            function _do() {
              var _event;
              if (state === 2) {
                if (e.timeStamp - lastMoveTime > 100) {
                  vx = 0;
                  vy = 0;
                }

                _event = newEvent('kdragend', e);
                $(target).trigger(_event);
              }
              state = 0;
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
            };

            return _event;
          }
        }
      };
    }]);
})(angular);