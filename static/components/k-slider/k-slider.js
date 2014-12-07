;(function (angular) { 'use strict';
  angular.module('kSlider', ['kDrag'])
    .directive('kSliderWrapper', ['$document', function ($document) {
      return {
        restrict: 'C',
        scope: {
          model: '=?kModel'
        },
        link: function (scope, element, attrs, controller) {
          var $kSliderWrapper = element;
          var $kSlider = $kSliderWrapper.find('.k-slider');
          var kSliderWrapperWidth;
          var rootFontSize;
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
            gotoSection: function (section, noAnimation) {
              this.currentSection = section;
              slideToSection(section, noAnimation);
            }
          }, scope.model);

          $kSliderWrapper
            .on('touchstart mousedown', function () {
              $kSlider.velocity('stop');
              kSliderWrapperWidth = $kSliderWrapper.width();
              rootFontSize = parseFloat($document.find('html').css('font-size'));
              scope.model.sectionCount = $kSlider.find('.k-slider-section').length;
              minTranslateX = (-kSliderWrapperWidth * (scope.model.sectionCount - 1)) / rootFontSize;
            })
            .on('kdragstart', function (e) {
              var $kSliderWrapper = $(e.currentTarget);

              if ($kSliderWrapper.hasClass('dragging')) {
                e.prevent();
                return;
              }

              $kSliderWrapper.addClass('dragging');
            })
            .on('kdrag', function (e) {
              var $kSliderWrapper = $(e.currentTarget);

              if (!$kSliderWrapper.hasClass('dragging')) {
                $kSliderWrapper.addClass('dragging');
              }

              var translateX = parseFloat($.Velocity.hook($kSlider, "translateX"));

              if (translateX < minTranslateX)
                e.stepX /= 1 + Math.abs(translateX - minTranslateX) * 6;
              else if (translateX > maxTranslateX)
                e.stepX /= 1 + Math.abs(translateX - maxTranslateX) * 6;

              $.Velocity.hook($kSlider, "translateX", (translateX + e.stepX / rootFontSize) + 'rem');
            })
            .on('mouseup touchend touchcancel', function (e) {
              var $kSliderWrapper = $(e.currentTarget);

              if (!$kSliderWrapper.hasClass('dragging')) {
                slideToSection(scope.model.currentSection);
              }
            })
            .on('kdragend', function (e) {
              var $kSliderWrapper = $(e.currentTarget);

              $kSliderWrapper.removeClass('dragging');

              scope.$apply(function () {
                if (e.vx > 0.3) {
                  scope.model.currentSection -= 1;
                } else if (e.vx < -0.3) {
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

          $.Velocity.hook($kSlider, "translateZ", '1px');
          scope.model.gotoSection(scope.model.currentSection, true);

          function computeMouseWheelDelta(eventArg) {
            if (eventArg.type == 'DOMMouseScroll' || eventArg.type == 'mousewheel') {
              return (eventArg.wheelDelta) ? eventArg.wheelDelta / 120 : -(eventArg.detail || 0) / 3;
            }
          };

          function slideToSection(section, noAnimation) {
            kSliderWrapperWidth = $kSliderWrapper.width();
            rootFontSize = parseFloat($document.find('html').css('font-size'));

            if (typeof section !== 'number') {
              section = scope.model.currentSection;
            }
            
            $kSlider.velocity('stop');

            var destTranslateX = -(section * kSliderWrapperWidth) / rootFontSize + 'rem';

            if (noAnimation) {
              $.Velocity.hook($kSlider, 'translateX', destTranslateX);
            } else {
              $kSlider.velocity({
                translateX: destTranslateX
              }, {
                easing: 'ease-out',
                duration: 250
              });
            }
          }

          function roundSection(translateX) {
            return Math.round((translateX || parseFloat($.Velocity.hook($kSlider, "translateX"))) / (kSliderWrapperWidth / rootFontSize));
          }
        }
      };
    }]);
})(angular);