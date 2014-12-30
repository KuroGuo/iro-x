;(function (angular) { 'use strict';
	angular.module('kSwipe', [])
		.factory('kSwipe', [function () {
			var pointerdownPageX, pointerdownPageY;

			return {
				bind: function ($element) {
					var element = $element[0] || $element;

					element.addEventListener('touchstart', onPointerdown);
					element.addEventListener('mousedown', onPointerdown);
					element.addEventListener('touchend', onPointerup);
					element.addEventListener('mouseup', onPointerup);
				}
			};

			function onPointerdown(e) {
				pointerdownPageX = e.pageX || e.changedTouches[0].pageX;
				pointerdownPageY = e.pageY || e.changedTouches[0].pageY;
			}

			function onPointerup(e) {
				var pageX = e.pageX || e.changedTouches[0].pageX;
				var pageY = e.pageY || e.changedTouches[0].pageY;

				var _event;

				if (pageX - pointerdownPageX < -30) {
					_event = newEvent('kSwipeLeft', e);
				} else if (pageX - pointerdownPageX > 30) {
					_event = newEvent('kSwipeRight', e);
				}

				if (pageY - pointerdownPageY < -30) {
					_event = newEvent('kSwipeTop', e);
				} else if (pageY - pointerdownPageY > 30) {
					_event = newEvent('kSwipeBottom', e);
				}

				if (_event) {
					angular.element(e.currentTarget).triggerHandler(_event);
				}
			}

		  function newEvent(name, e) {
		    var _event = $.Event(name);

		    _event.pageX = e.pageX || e.changedTouches[0].pageX;
		    _event.pageY = e.pageY || e.changedTouches[0].pageY;

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
		    _event.ctrlKey = e.ctrlKey;
		    _event.target = e.target;

		    return _event;
		  }
		}])
		.directive('kSwipeLeft', ['kSwipe', '$parse', function (kSwipe, $parse) {
			return {
				link: function ($scope, $element, attrs, controller) {
					linkSwipe('kSwipeLeft', kSwipe, $parse, $scope, $element, attrs);
				}
			};
		}])
		.directive('kSwipeRight', ['kSwipe', '$parse', function (kSwipe, $parse) {
			return {
				link: function ($scope, $element, attrs, controller) {
					linkSwipe('kSwipeRight', kSwipe, $parse, $scope, $element, attrs);
				}
			};
		}])
		.directive('kSwipeTop', ['kSwipe', '$parse', function (kSwipe, $parse) {
			return {
				link: function ($scope, $element, attrs, controller) {
					linkSwipe('kSwipeTop', kSwipe, $parse, $scope, $element, attrs);
				}
			};
		}])
		.directive('kSwipeBottom', ['kSwipe', '$parse', function (kSwipe, $parse) {
			return {
				link: function ($scope, $element, attrs, controller) {
					linkSwipe('kSwipeBottom', kSwipe, $parse, $scope, $element, attrs);
				}
			};
		}]);

		function linkSwipe(type, kSwipe, $parse, $scope, $element, attrs) {
			kSwipe.bind($element);

			var handler = $parse(attrs[type]);

			var options = angular.extend({
				mouse: true
			}, $parse(attrs.kSwipeOptions)($scope));

			$element.on(type, function (e) {
				if (!options.mouse && e.pointerType === 'mouse' && !e.ctrlKey) {
					return;
				}
				$scope.$apply(function () {
				  handler($scope, {$event: e});
				});
			});
		}
})(angular);