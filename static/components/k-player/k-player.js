;(function (angular) { 'use strict';
    angular.module('k-player', [])
        .directive('kPlayer', ['$document', '$window', function ($document, $window) {
            var window = $window;
            var document = $document[0];

            var socket = io('/danmu');

            return {
                restrict: 'E',
                templateUrl: '/static/components/k-player/k-player.html',
                scope: {
                    player: '=kModel'
                },
                link: function (scope, element, attrs, ctrl) {
                    window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
                    Blob.prototype.slice = Blob.prototype.slice || Blob.prototype.webkitSlice;

                    var $kPlayer = element;
                    var $timeBarWrapper = $kPlayer.find('.time-bar-wrapper');
                    var $timeBar = $kPlayer.find('.time-bar');
                    var $currentTimeBar = $timeBar.find('.current-bar');
                    var $timeCursor = $timeBar.find('.cursor');
                    var $canvas = $kPlayer.find('.canvas');
                    var $textboxComment = $kPlayer.find('.textbox-comment');
                    var $barTip = $timeBarWrapper.find('.bar-tip');
                    var context = $canvas[0].getContext('2d');
                    var video = $document[0].createElement('video');

                    bindEvents();

                    initModel();

                    initView();

                    function initView() {
                        $canvas.prop({
                            width: $canvas.width(),
                            height: $canvas.height()
                        });

                        render(0);
                    }

                    function initModel() {
                        scope.player = angular.extend({
                            currentTime: 0,
                            currentTimeDisplay: '00:00',
                            duration: 0,
                            durationDisplay: '00:00',
                            filename: null,
                            fileMD5: null,
                            paused: null
                        }, scope.player);

                        scope.player.play = function () {
                            video.play();
                        };

                        scope.player.pause = function () {
                            video.pause();
                        };

                        scope.player.toggleFullscreen = function () {
                            var kplayer = $kPlayer[0];

                            if (!document.fullscreenElement &&    // alternative standard method
                                !document.mozFullScreenElement && !document.webkitFullscreenElement) {  // current working methods
                                if (kplayer.requestFullscreen) {
                                    kplayer.requestFullscreen();
                                } else if (kplayer.mozRequestFullScreen) {
                                    kplayer.mozRequestFullScreen();
                                } else if (kplayer.webkitRequestFullscreen) {
                                    kplayer.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
                                }
                            } else {
                                if (document.cancelFullScreen) {
                                    document.cancelFullScreen();
                                } else if (document.mozCancelFullScreen) {
                                    document.mozCancelFullScreen();
                                } else if (document.webkitCancelFullScreen) {
                                    document.webkitCancelFullScreen();
                                }
                            }
                        };

                        scope.player.getCurrentSeconds = function (type) {
                            var result = video.currentTime;

                            if (type === 'string') {
                                result = formatTime(result);
                            }

                            return result;
                        };

                        scope.player.getTotalSeconds = function (type) {
                            var result = video.duration || 0;

                            if (type === 'string') {
                                result = formatTime(result);
                            }

                            return result;
                        };

                        scope.player.openFile = function () {
                            $('.k-player-input-file').remove();
                            var inputFile = $document[0].createElement('input');
                            inputFile.classList.add('k-player-input-file');
                            inputFile.type = 'file';
                            inputFile.style.visibility = 'hidden';
                            inputFile.onchange = function (e) {
                                var inputFile = e.currentTarget;
                                var file = inputFile.files[0];
                                setupPlayer(file, function () {
                                    $('.k-player-input-file').remove();
                                });
                            };
                            $('body').append($(inputFile));
                            $('.k-player-input-file').trigger('click');
                        };
                    }

                    function bindEvents() {
                        $kPlayer
                            .on('touchstart', function (e) {
                                if (!$(e.target).is('.textbox-comment, textbox-comment *')) {
                                    e.preventDefault();
                                }
                            })
                            .on('ktap', '.textbox-comment', function (e) {
                                if (e.pointerType === 'touch') {
                                    $textboxComment.trigger('focus');
                                }
                            })
                            .on('ktap', function (e) {
                                if (e.pointerType === 'touch' && !$(e.target).is('.textbox-comment')) {
                                    $textboxComment.trigger('blur');
                                }
                            })
                            .on('ktap', '.time-bar-wrapper', function (e) {
                                var $timeBar = $(e.currentTarget);
                                var innerX = e.pageX - $timeBar.offset().left;
                                var percent = innerX / $timeBar.innerWidth();

                                video.currentTime = video.duration * percent;
                            })
                            .on('mousemove', '.time-bar-wrapper', function (e) {
                                var parcent = (e.pageX - $timeBar.offset().left) / $timeBar.innerWidth();
                                var time = (video.duration * parcent) || 0;

                                $barTip.html(formatTime(time)).css({
                                    transform: 'translateX(' +  (($timeBar.innerWidth() - $barTip.outerWidth()) * parcent) + 'px)'
                                });
                            })
                            .on('ktap', '.btn-send', function (e) {
                                fireDanmu();
                            })
                            .on({
                                dragover: function (e) {
                                    e.preventDefault();

                                    e.originalEvent.dataTransfer.dropEffect = 'copy';
                                },
                                drop: function (e) {
                                    e.preventDefault();

                                    var file = e.originalEvent.dataTransfer.files[0];

                                    setupPlayer(file);
                                }
                            }, '.main-area');

                        $textboxComment.on('keydown', function (e) {
                            if (e.keyCode === 13) { //prevent enter key.
                                e.preventDefault();

                                fireDanmu();
                            }
                        });

                        $(video)
                            .on('loadedmetadata', function (e) {
                                socket.emit('load', {vid: scope.player.fileMD5, title: scope.player.filename});
                                scope.player.danmusOnCanvas = {};
                            })
                            .on('play pause', function (e) {
                                var video = e.currentTarget;

                                scope.$apply(function () {
                                    scope.player.paused = video.paused;
                                });
                            })
                            .on('timeupdate', function (e) {
                                var video = e.currentTarget;

                                setTimebar(video.currentTime, video.duration);

                                scope.$apply(function () {
                                    scope.player.currentTime = video.currentTime;
                                    scope.player.currentTimeDisplay = formatTime(video.currentTime);

                                    if (!scope.player.danmusOnCanvas)
                                        scope.player.danmusOnCanvas = {};

                                    if (scope.player.danmus) {
                                        scope.player.danmus.forEach(function (danmu) {
                                            if (parseInt(danmu.videoTime, 10) !== parseInt(video.currentTime, 10))
                                                return;

                                            if (!scope.player.danmusOnCanvas[danmu._id]) {
                                                addNewDanmuToCanvas(danmu);
                                            }
                                        });
                                    }
                                });
                            })
                            .on('durationchange', function (e) {
                                var video = e.currentTarget;

                                scope.player.duration = video.duration;
                                scope.player.durationDisplay = formatTime(video.duration);
                            })
                            .on('seeking', function () {
                                scope.player.danmusOnCanvas = {};
                            });

                        $($window).on('resize.kplayer', function () {
                            $canvas.prop({
                                width: $canvas.width(),
                                height: $canvas.height()
                            });
                        });

                        var socketEvents = [{
                            name: 'load',
                            handler: function (e) {
                                var danmus = e.danmus;

                                if (scope.player.paused !== true) {
                                    $canvas.prop({
                                        width: $canvas.width(),
                                        height: $canvas.height()
                                    });
                                    
                                    video.play();
                                }

                                scope.$apply(function () {
                                    scope.player.danmus = danmus;
                                });
                            }
                        }, {
                            name: 'newDanmu',
                            handler: function (danmu) {
                                scope.player.danmus.push(danmu);
                            }
                        }];

                        socketEvents.forEach(function (event) {
                            socket.on(event.name, event.handler);
                        });

                        scope.$watch('player.src', function (newValue) {
                            if (newValue) {
                                video.src = newValue;
                            }
                        });

                        scope.$watch('player.currentTime', function (newValue) {
                            if (newValue && Math.abs(newValue - video.currentTime) > 1) {
                                if (video.readyState) {
                                    video.currentTime = newValue;
                                } else {
                                    $(video).one('loadedmetadata', function () {
                                        video.currentTime = newValue;
                                    });
                                }
                            }
                        });

                        element.on('$destroy', function () {
                            $($window).off('.kplayer');
                            $(video).off();
                            video.pause();
                            video.src = '#';
                            video = null;
                            socketEvents.forEach(function (event) {
                                socket.off(event.name, event.handler);
                            });
                            context = null;
                        });
                    }

                    function setupPlayer(file, callback) {
                        fastComputeFileMD5(file, function (err, md5) {
                            if (err) {
                                alert('哎呀，貌似文件打不开有问题>_<');
                            } else {
                                window.URL.revokeObjectURL(scope.player.src);

                                $(video).one('loadedmetadata', function (e) {
                                    e.currentTarget.currentTime = 0; // 视频从最开始播放    
                                });

                                scope.$apply(function () {
                                    scope.player.filename = file.name;
                                    scope.player.fileMD5 = md5;
                                    scope.player.src = window.URL.createObjectURL(file);
                                });
                            }
                            
                            if (typeof callback === 'function') {
                                callback.call(this);
                            }
                        });
                    }

                    function fireDanmu() {
                        var content = $textboxComment.text();

                        if (!content || !video.duration)
                            return;

                        var newDanmu = {content: content, videoTime: video.currentTime};

                        socket.emit('say', newDanmu);
                        newDanmu._id = new Date().getTime();
                        addNewDanmuToCanvas(newDanmu);
                        scope.player.danmus.push(newDanmu);
                        $textboxComment.empty();
                    }

                    /*
                        快速计算文件MD5
                        只是计算一个文件的特定部分，并非计算整个文件
                    */
                    function fastComputeFileMD5(file, callback) {
                        var fileParts = [
                            file.slice(0, 30000),
                            file.slice(file.size / 2 - 30000, file.size / 2 + 30000),
                            file.slice(file.size - 30000, file.size)
                        ];
                        var fileReader;

                        try {
                            fileReader = new FileReader()
                            fileReader.onload = function (e) {
                                var resultTrimedDataURLHead = e.currentTarget.result.slice(e.currentTarget.result.indexOf('base64,') + 'base64,'.length),
                                    md5 = CryptoJS.MD5(resultTrimedDataURLHead).toString();

                                if (typeof callback === 'function') {
                                    callback(null, md5);                            
                                }
                            };
                            fileReader.readAsDataURL(new Blob(fileParts));
                        } catch (err) {
                            callback(err, null);
                        }
                    }

                    function formatTime(seconds) {
                        var m = Math.floor(seconds / 60);
                        var s = Math.round(seconds % 60);

                        if (m.toString().length === 1) {
                            m = '0' + m;
                        }
                        if (s.toString().length === 1) {
                            s = '0' + s;
                        }

                        return m + ':' + s;
                    }

                    function setTimebar(currentTime, totalTime) {
                        var percent = currentTime / totalTime;

                        $currentTimeBar.css({
                            width: (percent * 100) + '%'
                        });

                        $timeCursor.css({
                            transform: 'translateX(' + (($timeBar.innerWidth() - $timeCursor.outerWidth()) * percent) + 'px)'
                        });
                    }

                    function addNewDanmuToCanvas(danmu) {
                        var v = -($canvas[0].width + context.measureText(danmu.content).width) / 8000; //-(0.13 + danmu.content.length / 200);

                        scope.player.danmusOnCanvas[danmu._id] = {
                            danmu: danmu,
                            v: v,
                            x: 0,
                            y: (function () {
                                var y, danmuId, _danmu, allGreen, elapseTime;

                                for (y = 0; true; y++) {
                                    allGreen = true;

                                    for (danmuId in scope.player.danmusOnCanvas) {
                                        _danmu = scope.player.danmusOnCanvas[danmuId];

                                        if (_danmu.y !== y) 
                                            continue;

                                        elapseTime = Math.abs(($canvas[0].width + _danmu.x + context.measureText(_danmu.danmu.content).width) / _danmu.v);

                                        if (_danmu.x + context.measureText(_danmu.danmu.content).width > 0
                                            || Math.abs(v * elapseTime) > $canvas[0].width) {
                                            allGreen = false;
                                            break;
                                        }
                                    }

                                    if (allGreen)
                                        return y;
                                }
                            })()
                        };
                    }

                    function drawVideo() {
                        var width, height, x, y;

                        if (video.videoWidth / video.videoHeight >= $canvas.prop('width') / $canvas.prop('height')) {
                            width = $canvas.prop('width');
                            height = $canvas.prop('width') * video.videoHeight / video.videoWidth;
                            x = 0;
                            y = ($canvas.prop('height') - height) / 2;
                        } else {
                            height = $canvas.prop('height');
                            width = $canvas.prop('height') * video.videoWidth / video.videoHeight;
                            y = 0;
                            x = ($canvas.prop('width') - width) / 2;
                        }

                        context.drawImage(video, x, y, width, height);                    
                    }

                    function drawDanmus(time) {
                        var currentTime = video.currentTime;
                        var danmus = scope.player.danmus;
                        var fontSize = parseFloat($canvas.css('font-size')) * 1.8;

                        if (!danmus) return;

                        context.textBaseline = 'bottom';
                        context.fillStyle = 'white';
                        context.strokeStyle = 'black';
                        context.lineWidth = 3;
                        context.font = fontSize + 'px "Helvetica Neue", Helvetica, Arial, "Hiragino Sans GB", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif';

                        var danmuId, danmu, x;

                        for (danmuId in scope.player.danmusOnCanvas) {
                            danmu =  scope.player.danmusOnCanvas[danmuId];
                            x = $canvas[0].width + danmu.x;

                            context.strokeText(danmu.danmu.content, x, (danmu.y + 1) * fontSize * 1.2);
                            context.fillText(danmu.danmu.content, x, (danmu.y + 1) * fontSize * 1.2);
                        }
                    }

                    function update(time) {
                        var danmuId, danmu, recyclingDanmuIds = [];

                        for (danmuId in scope.player.danmusOnCanvas) {
                            danmu = scope.player.danmusOnCanvas[danmuId];

                            if (!danmu.startTime)
                                danmu.startTime = time;

                            if (!scope.player.paused) {
                                danmu.x += danmu.v * (time - window.lastAnimationFrameTime);

                                if ($canvas[0].width + danmu.x + context.measureText(danmu.danmu.content).width < 0) {
                                    recyclingDanmuIds.push(danmu.danmu._id);
                                }
                            }
                        }

                        recyclingDanmuIds.forEach(function (danmuId) {
                            delete scope.player.danmusOnCanvas[danmuId];
                        });
                    }

                    function render(time) {
                        if (context) {
                            context.clearRect(0, 0, $canvas[0].width, $canvas[0].height);

                            update(time);

                            drawVideo();
                            drawDanmus(time);

                            window.lastAnimationFrameTime = time;
                        
                            window.requestAnimationFrame(render);
                        }
                    }
                }
            };
        }]);
})(angular);