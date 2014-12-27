;(function (angular) { 'use strict';
  angular.module('kDrag', [])
    .factory('kDrag', ['$document', '$window', function ($document, $window) {
      return {
        bind: function (element) {
          element[0].addEventListener('mousedown', dragStart);
          element[0].addEventListener('touchstart', dragStart);
        }
      };

      function dragStart(e) {
        var state = 0; // 0: 初始状态, 1: 按下, 2: dragging
        var pointerdownPageXY; // 按下时的PageXY
        var lastMovePageXY, pageXY; // 拖动时和拖动结束时的PageXY
        var lastFramePageXY, lastFrameTime, frameTakesTime, lastMoveTime, currentTime;
        var vx, vy;
        var target; // 拖动的目标element，非常重要！！！
        var adsorb;
        var element = angular.element(e.currentTarget);
        var document = $document[0];

        var requestedFrameToken;
        
        if (e.which && e.which !== 1) {
          return;
        }
        
        lastMovePageXY = lastFramePageXY = pageXY = pointerdownPageXY = getEventPageXY(e);
        currentTime = lastMoveTime = e.timeStamp;
        target = e.target;
        adsorb = parseFloat($(target).attr('k-drag-adsorb')) || 0;
        state = 1;

        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag);

        document.addEventListener('mouseup', dragend);
        document.addEventListener('touchend', dragend);
        document.addEventListener('touchcancel', dragend);

        $window.addEventListener('blur', dragend);

        function drag(e) {         
          if (state < 1) {
            return;
          }

          if (e.type === 'touchmove' && e.targetTouches[0].target !== target) {
            return;
          }

          lastMovePageXY = pageXY;
          pageXY = getEventPageXY(e);
          lastMoveTime = currentTime;
          currentTime = e.timeStamp;

          if (!requestedFrameToken) {
            requestedFrameToken = $window.requestAnimationFrame(function (time) {
              var _event;

              if (state === 1) {
                if (Math.abs(pageXY.x - pointerdownPageXY.x) >= adsorb
                || Math.abs(pageXY.y - pointerdownPageXY.y) >= adsorb) {
                  _event = newEvent('kdragstart', e);
                  state = 2;
                  element.triggerHandler(_event);
                }
              }

              if (state === 2) {
                _event = newEvent('kdrag', e);
                element.triggerHandler(_event);
              }

              var newVx, newVy;

              if (lastFramePageXY) {
                newVx = (pageXY.x - lastFramePageXY.x) / (time - lastFrameTime || 17);
                newVy = (pageXY.y - lastFramePageXY.y) / (time - lastFrameTime || 17);
                if (Math.abs(newVx) >= Math.abs(vx || 0) || Math.abs(newVx - (vx || 0)) > Math.abs(vx || 0)) {
                  vx = newVx;
                } else {
                  vx = vx * 0.7 + newVx * 0.3;
                }
                if (Math.abs(newVy) >= Math.abs(vy || 0) || Math.abs(newVy - (vy || 0)) > Math.abs(vy || 0)) {
                  vy = newVy;
                } else {
                  vy = vy * 0.7 + newVy * 0.3;
                }
              }

              lastFramePageXY = pageXY;
              if (lastFrameTime) {
                frameTakesTime = time - lastFrameTime;  
              }
              lastFrameTime = time;

              requestedFrameToken = null;
            });
          }
        }

        function dragend(e) {
          if (requestedFrameToken) {
            $window.requestAnimationFrame(function () {
              _dragend(e);
            });
          } else {
            _dragend(e);
          }
        }

        function _dragend(e) {
          if (e && e.type === 'touchend' && e.changedTouches[0].target !== target)
            return;

          var _event;
          if (state === 2) {
            if (pageXY.x === lastMovePageXY.x) {
              vx = 0;
            }
            if (pageXY.y === lastMovePageXY.y) {
              vy = 0;
            }
            if (e.timeStamp - lastMoveTime > (frameTakesTime * 5 || 100)) {
              vx = 0;
              vy = 0;
            }

            pageXY = getEventPageXY(e);

            _event = newEvent('kdragend', e);
            element.triggerHandler(_event);
          }
          state = 0;

          document.removeEventListener('mousemove', drag);
          document.removeEventListener('touchmove', drag);

          document.removeEventListener('mouseup', dragend);
          document.removeEventListener('touchend', dragend);
          document.removeEventListener('touchcancel', dragend);
          
          $window.removeEventListener('blur', dragend);
        }

        function newEvent(name, e) {
          var _event = $.Event(name);

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
            _event.touchId = e.changedTouches[0].identifier;
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
          _event.target = target;

          return _event;
        }
      }

      function getEventPageXY(e) {
        var touch, pageX, pageY;

        if (e.type.indexOf("touch") > -1) {
          if (e.type === 'touchmove') {
            touch = e.targetTouches[0];
          } else {
            touch = e.changedTouches[0];  
          }
          pageX = touch.pageX;
          pageY = touch.pageY;
        } else {
          pageX = e.pageX;
          pageY = e.pageY;
        }

        return {x: pageX, y: pageY};
      }
    }])
    .directive('kDraggable', ['kDrag', function (kDrag) {
      return {
        restrict: 'C',
        link: function (scope, element, attrs, controller) {
          kDrag.bind(element);
        }
      };
    }]);
})(angular);