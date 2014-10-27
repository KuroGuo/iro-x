;(function (angular) { 'use strict';
    angular.module('kTap', [])
        .directive('kTap', ['$window', '$document', '$parse', function ($window, $document, $parse) {
            return {
                restrict: 'A',
                link: function (scope, element, attrs, controller) {
                    element.on('tap', function (e) {
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
                    var startTime, startPageX, startPageY, startTarget;

                    $document
                        .on('mousedown touchstart', function (e) {
                            if (e.which && e.which !== 1) {
                                return;
                            }

                            var touch;

                            startTime = new Date().getTime();
                            startTarget = e.target;

                            if (e.type === 'mousedown') {
                                startPageX = e.pageX;
                                startPageY = e.pageY;
                            } else if (e.type === 'touchstart') {
                                touch = e.originalEvent.changedTouches[0];
                                startPageX = touch.pageX;
                                startPageY = touch.pageY;
                            }
                        })
                        .on('mouseup touchend', function (e) {
                            var now = new Date().getTime();
                            var touch;
                            var event;
                            var pageX, pageY;

                            if (e.type === 'mouseup') {
                                pageX = e.pageX;
                                pageY = e.pageY;
                            } else if (e.type === 'touchend') {
                                touch = e.originalEvent.changedTouches[0];
                                pageX = touch.pageX;
                                pageY = touch.pageY;
                            }

                            if (e.target === startTarget
                            &&now - startTime < 750
                            && Math.abs(pageX - startPageX) < 20
                            && Math.abs(pageY - startPageY) < 20) {
                                event = $.Event('tap');

                                event.pageX = pageX;
                                event.pageY = pageY;

                                if (e.type === 'mouseup') {
                                    event.pointerType = 'mouse';
                                } else if (e.type === 'touchend') {
                                    event.pointerType = 'touch';
                                }
                                event.preventDefault = function () {
                                    e.preventDefault();
                                };

                                $(e.target).trigger(event);
                            }
                        });
                }
            };
        }]);
})(angular);