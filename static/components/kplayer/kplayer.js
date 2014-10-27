'use strict';

angular.module('kplayer', [])
    // .factory('kPlayer', ['$document', function ($document) {
    //     var video = $document[0].createElement('video');

    //     return {
    //         video: video,
    //         danmus: []
    //     };
    // }])
    .directive('kModel', [function () {
        return {
            controller: [function () {}],
            link: function (scope, element, attrs, ctrl) {
                scope[attrs.kModel] = ctrl;
            }
        };
    }])
    .directive('kPlayer', ['$document', '$window', function ($document, $window) {
        var window = $window;
        var document = $document[0];

        var kPlayer = {
            socket: io('/danmu'),
            video: $document[0].createElement('video'),
            model: null
        };

        return {
            restrict: 'E',
            require: '?kModel',
            templateUrl: '/static/components/kplayer/template.html',
            scope: {
                player: '=kModel'
            },
            link: function (scope, element, attrs, player) {
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
                var socket = kPlayer.socket;
                var video = kPlayer.video;

                $kPlayer
                    .on('touchstart', function (e) {
                        if (!$(e.target).is('.textbox-comment, textbox-comment *')) {
                            e.preventDefault();
                        }
                    })
                    .on('tap', '.textbox-comment', function (e) {
                        $textboxComment.trigger('focus');

                        if (e.pointerType === 'touch') {
                            $(document).one('touchstart', function () {
                                $textboxComment.trigger('blur');
                            });
                        }
                    })
                    .on('tap', '.time-bar-wrapper', function (e) {
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
                    .on('tap', '.btn-send', function (e) {
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
                    .on('canplay', function () {
                        socket.emit('load', {vid: player.fileMD5, title: player.filename});
                        player.danmusOnCanvas = {};
                    })
                    .on('timeupdate', function (e) {
                        var video = e.currentTarget;

                        setTimebar(video.currentTime, video.duration);

                        scope.$apply(function () {
                            if (!player.danmusOnCanvas)
                                player.danmusOnCanvas = {};

                            player.danmus.forEach(function (danmu) {
                                if (parseInt(danmu.videoTime, 10) !== parseInt(video.currentTime, 10))
                                    return;

                                if (!player.danmusOnCanvas[danmu._id]) {
                                    addNewDanmuToCanvas(danmu);
                                }
                            });
                        });
                    })
                    .on('seeking', function () {
                        player.danmusOnCanvas = {};
                    });

                $($window).on('resize.kplayer', function () {
                    $canvas.prop({
                        width: $canvas.width(),
                        height: $canvas.height()
                    });
                });

                element.on('$destroy', function () {
                    $($window).off('.kplayer');
                    video.pause();
                    $(video).off();
                    socket.removeAllListeners();
                    context = null;
                });

                socket.on('load', function (e) {
                    var danmus = e.danmus;

                    console.log('danmus', danmus);

                    player.play();

                    scope.$apply(function () {
                        player.danmus = danmus;
                    });
                });

                socket.on('newDanmu', function (danmu) {
                    player.danmus.push(danmu);
                });

                $canvas.prop({
                    width: $canvas.width(),
                    height: $canvas.height()
                });

                player.isPaused = function () {
                    return video.paused || !video.src;
                };

                player.isStopped = function () {
                    return !video.src;
                };

                player.play = function () {
                    video.play();
                };

                player.pause = function () {
                    video.pause();
                };

                player.toggleFullscreen = function () {
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

                player.getCurrentSeconds = function (type) {
                    var result = video.currentTime;

                    if (type === 'string') {
                        result = formatTime(result);
                    }

                    return result;
                };

                player.getTotalSeconds = function (type) {
                    var result = video.duration || 0;

                    if (type === 'string') {
                        result = formatTime(result);
                    }

                    return result;
                };

                player.openFile = function () {
                    var inputFile = $document[0].createElement('input');
                    inputFile.type = 'file';
                    inputFile.style.visibility = 'hidden';
                    inputFile.onchange = function (e) {
                        var inputFile = e.currentTarget;
                        var file = inputFile.files[0];
                        setupPlayer(file, function () {
                            $(inputFile).remove();
                        });
                    };
                    $('body').append($(inputFile));
                    $(inputFile).trigger('click');
                };

                if (kPlayer.model) {
                    player.fileMD5 = kPlayer.model.fileMD5;
                    player.title = kPlayer.model.title;
                    $(video).triggerHandler('canplay');
                }

                kPlayer.model = player;

                render(0);

                function setupPlayer(file, callback) {
                    fastComputeFileMD5(file, function (err, md5) {
                        if (err) {
                            alert('哎呀，貌似文件打不开有问题>_<');
                        } else {
                            player.filename = file.name;
                            player.fileMD5 = md5;

                            video.src = window.URL.createObjectURL(file);
                        }
                        
                        if (typeof callback === 'function') {
                            callback.call(this);
                        }
                    });
                }

                function fireDanmu() {
                    var content = $textboxComment.text();

                    if (!content)
                        return;

                    if (player.isPaused())
                        return;

                    socket.emit('say', {content: content, videoTime: video.currentTime});
                    addNewDanmuToCanvas({
                        _id: new Date().getTime(),
                        content: content,
                        videoTime: video.currentTime
                    });
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

                    player.danmusOnCanvas[danmu._id] = {
                        danmu: danmu,
                        v: v,
                        x: 0,
                        y: (function () {
                            var y, danmuId, _danmu, allGreen, elapseTime;

                            for (y = 0; true; y++) {
                                allGreen = true;

                                for (danmuId in player.danmusOnCanvas) {
                                    _danmu = player.danmusOnCanvas[danmuId];

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
                    var danmus = player.danmus;
                    var fontSize = parseFloat($canvas.css('font-size')) * 1.8;

                    if (!danmus) return;

                    context.textBaseline = 'bottom';
                    context.fillStyle = 'white';
                    context.strokeStyle = 'black';
                    context.lineWidth = 3;
                    context.font = fontSize + 'px "Helvetica Neue", Helvetica, Arial, "Hiragino Sans GB", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif';

                    var danmuId, danmu, x;

                    for (danmuId in player.danmusOnCanvas) {
                        danmu =  player.danmusOnCanvas[danmuId];
                        x = $canvas[0].width + danmu.x;

                        context.strokeText(danmu.danmu.content, x, (danmu.y + 1) * fontSize * 1.2);
                        context.fillText(danmu.danmu.content, x, (danmu.y + 1) * fontSize * 1.2);
                    }
                }

                function update(time) {
                    var danmuId, danmu, recyclingDanmuIds = [];

                    for (danmuId in player.danmusOnCanvas) {
                        danmu = player.danmusOnCanvas[danmuId];

                        if (!danmu.startTime)
                            danmu.startTime = time;

                        if (!player.isPaused()) {
                            danmu.x += danmu.v * (time - window.lastAnimationFrameTime);

                            if ($canvas[0].width + danmu.x + context.measureText(danmu.danmu.content).width < 0) {
                                recyclingDanmuIds.push(danmu.danmu._id);
                            }
                        }
                    }

                    recyclingDanmuIds.forEach(function (danmuId) {
                        delete player.danmusOnCanvas[danmuId];
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
    }])