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
        var pageXY; // 拖动时和拖动结束时的PageXY
        var lastFramePageXY, lastFrameTime;
        var dragEventArg, vx, vy;
        var target; // 拖动的目标element，非常重要！！！
        var adsorb;
        var $element = angular.element(e.currentTarget);
        var element = $element[0];
        var document = $document[0];

        var requestedFrameToken;
        
        if (e.which && e.which !== 1) {
          return;
        }
        
        lastFramePageXY = pageXY = pointerdownPageXY = getEventPageXY(e);
        target = e.target;
        adsorb = parseFloat($(e.currentTarget).attr('k-drag-adsorb')) || 0;
        state = 1;

        document.addEventListener('mousemove', drag, true);
        element.addEventListener('touchmove', drag, true);

        document.addEventListener('mouseup', dragend, true);
        element.addEventListener('touchend', dragend, true);
        element.addEventListener('touchcancel', dragend, true);

        $window.addEventListener('blur', dragend, true);

        function drag(e) {         
          if (state < 1) {
            return;
          }

          if (e.type === 'touchmove' && e.targetTouches[0].target !== target) {
            return;
          }

          pageXY = getEventPageXY(e);

          var _event;

          dragEventArg = e;

          if (state === 1) {
            if (Math.abs(pageXY.x - pointerdownPageXY.x) >= adsorb
            || Math.abs(pageXY.y - pointerdownPageXY.y) >= adsorb) {
              dragFrame();
              state = 2;
              _event = newEvent('kdragstart', e);
              $element.triggerHandler(_event);
            }
          }
        }

        function dragFrame(time) {
          requestedFrameToken = $window.requestAnimationFrame(dragFrame);
          
          var _event;
          var newVx, newVy;

          if (state === 2) {
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

            if (pageXY.x !== lastFramePageXY.x || pageXY.y !== lastFramePageXY.y) {
              _event = newEvent('kdrag', dragEventArg);
              $element.triggerHandler(_event);
            }

            lastFramePageXY = pageXY;
            lastFrameTime = time;
          }
        }

        function dragend(e) {
          $window.cancelAnimationFrame(requestedFrameToken);
          
          if (e && e.type === 'touchend' && e.changedTouches[0].target !== target)
            return;

          var _event;
          if (state === 2) {
            pageXY = getEventPageXY(e);

            _event = newEvent('kdragend', e);
            $element.triggerHandler(_event);
          }
          state = 0;

          document.removeEventListener('mousemove', drag, true);
          element.removeEventListener('touchmove', drag, true);

          document.removeEventListener('mouseup', dragend, true);
          element.removeEventListener('touchend', dragend, true);
          element.removeEventListener('touchcancel', dragend, true);
          
          $window.removeEventListener('blur', dragend, true);
        }

        function newEvent(name, e) {
          var _event = $.Event(name);

          _event.pageX = pageXY.x;
          _event.pageY = pageXY.y;
          _event.deltaX = (pageXY.x - pointerdownPageXY.x);
          _event.deltaY = (pageXY.y - pointerdownPageXY.y);
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

          Object.defineProperty(_event, 'state', {
            get: function () {
              return state;
            }
          });

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
