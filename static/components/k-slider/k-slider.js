;(function (angular) { 'use strict';
  angular.module('kSlider', ['kDrag'])
    .directive('kSliderWrapper', [function () {
      return {
        restrict: 'C',
        scope: {
          model: '=?kModel'
        },
        link: function (scope, element, attrs, controller) {
          var $kSliderWrapper = element;
          var $kSlider = $kSliderWrapper.find('.k-slider');
          var kSliderWrapperWidth;
          var minTranslateX;
          var maxTranslateX = 0;

          scope.model = angular.extend({
            sectionCount: 0,
            _currentSection: 0,
            get currentSection() {
              return this._currentSection;
            },
            set currentSection(value) {
              if (value < 0) {
                value = 0;
              } else if (value > this.sectionCount - 1) {
                value = this.sectionCount - 1;
              }
              this._currentSection = value;
            },
            gotoSection: function (section) {
              this.currentSection = section;
              slideToSection(section);
            }
          }, scope.model);

          $.Velocity.hook($kSlider, "translateZ", '1px');

          $kSliderWrapper
            .on('touchstart mousedown', function () {
              $kSlider.velocity('stop');
              kSliderWrapperWidth = $kSliderWrapper.width();
              scope.model.sectionCount = $kSlider.find('.k-slider-section').length;
              minTranslateX = -kSliderWrapperWidth * (scope.model.sectionCount - 1);
            })
            .on('kdrag', function (e) {
              var translateX = parseFloat($.Velocity.hook($kSlider, "translateX"));

              if (translateX < minTranslateX)
                e.stepX /= 1 + Math.abs(translateX - minTranslateX) / 3;
              else if (translateX > maxTranslateX)
                e.stepX /= 1 + Math.abs(translateX - maxTranslateX) / 3;

              $.Velocity.hook($kSlider, "translateX", (translateX + e.stepX) + 'px');
            })
            .on('kdragend', function (e) {
              scope.$apply(function () {
                if (e.vx > 0.1) {
                  scope.model.currentSection -= 1;
                } else if (e.vx < -0.1) {
                  scope.model.currentSection += 1;
                } else {
                  scope.model.currentSection = -roundSection(parseFloat($.Velocity.hook($kSlider, "translateX")));
                }
              });

              slideToSection(scope.model.currentSection);
            })
            .on('mousewheel DOMMouseScroll', function (e) {
              if (e.ctrlKey)
                return;
              e.preventDefault();
              var delta = computeMouseWheelDelta(e.originalEvent);

              scope.$apply(function () {
                if (delta > 0) {
                  scope.model.currentSection -= 1;
                } else if (delta < 0) {
                  scope.model.currentSection += 1;
                }
              });

              slideToSection(scope.model.currentSection);
            });

          function computeMouseWheelDelta(eventArg) {
            if (eventArg.type == 'DOMMouseScroll' || eventArg.type == 'mousewheel') {
              return (eventArg.wheelDelta) ? eventArg.wheelDelta / 120 : -(eventArg.detail || 0) / 3;
            }
          };

          function slideToSection(section) {
            kSliderWrapperWidth = $kSliderWrapper.width();
            
            $kSlider
              .velocity('stop')
              .velocity({
                translateX: -((section || scope.model.currentSection) * kSliderWrapperWidth)
              }, {
                easing: 'ease-out',
                duration: 200
              });
          }

          function roundSection(translateX) {
            return Math.round((translateX || parseFloat($.Velocity.hook($kSlider, "translateX"))) / kSliderWrapperWidth);
          }
        }
      };
    }]);
})(angular);