;(function (angular) { 'use strict';
    angular.module('kTap', ['kDrag'])
        .directive('kTap', ['$window', '$document', '$parse', function ($window, $document, $parse) {
            return {
                restrict: 'A',
                link: function (scope, element, attrs, controller) {
                    element.on('ktap', function (e) {
                        var tapHandler = $parse(attrs.kTap);

                        scope.$apply(function () {
                            tapHandler(scope, {$event: e});    
                        });
                    });
                }
            };
        }])
        .directive('html', ['$document', function ($document) {
            return {
                restrict: 'E',
                link: function (scope, element, attrs, controller) {
                    var startTime, startTarget, startPageX, startPageY;
                    var state = 0; //0: 初始状态, 1: 按下

                    $document
                        .on('mousedown touchstart', function (e) {
                            if (e.which && e.which !== 1) {
                                return;
                            }

                            var touch;

                            if (e.type === 'mousedown') {
                                startPageX = e.pageX;
                                startPageY = e.pageY;
                            } else if (e.type === 'touchstart') {
                                touch = e.originalEvent.changedTouches[0];
                                startPageX = touch.pageX;
                                startPageY = touch.pageY;
                            }

                            startTime = new Date().getTime();
                            startTarget = e.target;

                            state = 1;
                        })
                        .on('mouseup touchend touchcancel', function (e) {
                            if (state < 1)
                                return;
                            
                            var now = new Date().getTime();
                            var touch;
                            var _event;
                            var pageX, pageY;

                            if (e.type === 'mouseup') {
                                pageX = e.pageX;
                                pageY = e.pageY;
                            } else if (e.type === 'touchend') {
                                touch = e.originalEvent.changedTouches[0];
                                pageX = touch.pageX;
                                pageY = touch.pageY;
                            }

                            if (Math.abs(pageX - startPageX) > 10 || Math.abs(pageY - startPageY) > 10)
                                return;

                            if (now - startTime > 750)
                                return;

                             if (e.target !== startTarget)
                                return;

                            _event = $.Event('ktap');

                            _event.pageX = pageX;
                            _event.pageY = pageY;

                            if (e.type === 'mouseup') {
                                _event.pointerType = 'mouse';
                            } else if (e.type === 'touchend') {
                                _event.pointerType = 'touch';
                            }
                            _event.preventDefault = function () {
                                e.preventDefault();
                            };

                            state = 0;
                            $(e.target).trigger(_event);
                        });
                }
            };
        }]);
})(angular);