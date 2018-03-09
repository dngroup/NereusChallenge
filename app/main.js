'use strict';



//eval(function(p,a,c,k,e,d){e=function(c){return c.toString(36)};if(!''.replace(/^/,String)){while(c--){d[c.toString(a)]=k[c]||c.toString(a)}k=[function(e){return d[e]}];e=function(){return'\\w+'};c=1};while(c--){if(k[c]){p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c])}}return p}('5.6(\'f\',[\'4\']).3(\'e\',1($0){7 $0(\'8/g.d\',{},{b:{c:\'9\',a:2}})});5.6(\'i\',[\'4\']).3(\'j\',1($0){7 $0(\'8/h.d\',{},{b:{c:\'9\',a:2}})});',20,20,'resource|function|false|factory|ngResource|angular|module|return|app|GET|isArray|query|method|json|PlayerLibraries|DashPlayerLibrariesService|player_libraries|showcase_libraries|DashShowcaseLibrariesService|ShowcaseLibraries'.split('|'),0,{}))


var app = angular.module('DashPlayer', [
    'ngRoute',
    'angularTreeview',
    'rzModule',
    'ngSanitize',
    'ngIdle'
]);

app.factory('ShareService', function() {
    var savedData = {}
    function set(data) {
        savedData = data;
    }
    function get() {
        return savedData;
    }

    return {
        set: set,
        get: get
    }

});

app.directive('chart', function() {
    return {
        restrict: 'E',
        link: function (scope, elem, attrs) {
            var chart = null,
                options = {
                    series: {
                        shadowSize: 0
                    },
                    yaxis: {
                        min: 0,
                        max: 60
                    },
                    xaxis: {
                        show: false
                    }
                };

            // If the data changes somehow, update it in the chart
            scope.$watch('bufferData', function(v) {
                if (v === null || v === undefined) {
                    return;
                }

                if (!chart) {
                    chart = $.plot(elem, v , options);
                    elem.show();
                }
                else {
                    chart.setData(v);
                    chart.setupGrid();
                    chart.draw();
                }
            });

            scope.$watch('invalidateChartDisplay', function(v) {
                if (v && chart) {
                    var data = scope[attrs.ngModel];
                    chart.setData(data);
                    chart.setupGrid();
                    chart.draw();
                    scope.invalidateDisplay(false);
                }
            });
        }
    };
});

app.config(function(IdleProvider, $routeProvider){
    $routeProvider.when('/player/:session?', {
        templateUrl: '/player.html',
        controller: 'DashController'
    });
    IdleProvider.idle(600);
    IdleProvider.timeout(5);


});

app.controller('DashController', function($scope, $sce, $http, Idle, $window, $routeParams, ShareService) {
    var player,
//        controlbar,
        video,
        ttmlDiv,
        context,
        videoSeries = [],
        audioSeries = [],
        maxGraphPoints = 50,
        interval = setInterval(pingServer, 20000),
        intervalQualityStats,
        urlLogServer,
        initialDate,
        timeMaxBuffer = 8,
        BaseURL = "http://msstream.viotech.net",
        initialServers = 3,
        currentEmptyBufferEvent = null;


    var nereusMOSService = $window.nereusMOSService();




    $scope.sessionId = $routeParams.session;

    $http.get(BaseURL + "/api/unsecure/logs/addr")
        .success(function(data){
        urlLogServer = data;
        })
        .error(function(data){

        })


    Idle.watch();

    ////////////////////////////////////////
    //
    // Metrics
    //
    ////////////////////////////////////////

    $scope.mosScore = 0;
    $scope.computeMOS = function() {
        $scope.mosScore = nereusMOSService.computeMOS();
    }
    $scope.slider = [];

    $scope.videoBitrate = 0;
    $scope.videoIndex = 0;
    $scope.videoPendingIndex = "";
    $scope.videoMaxIndex = 0;
    $scope.videoBufferLength = 0;
    $scope.videoDroppedFrames = 0;
    $scope.videoLatencyCount = 0;
    $scope.videoLatency = "";
    $scope.videoDownloadCount = 0;
    $scope.videoDownload = "";
    $scope.videoRatioCount = 0;
    $scope.videoRatio = "";

    $scope.audioBitrate = 0;
    $scope.audioIndex = 0;
    $scope.audioPendingIndex = "";
    $scope.audioMaxIndex = 0;
    $scope.audioBufferLength = 0;
    $scope.audioDroppedFrames = 0;
    $scope.videoLatencyCount = 0;
    $scope.audioLatency = "";
    $scope.audioDownloadCount = 0;
    $scope.audioDownload = "";
    $scope.audioRatioCount = 0;
    $scope.audioRatio = "";

    var converter = new MetricsTreeConverter();
    $scope.videoMetrics = null;
    $scope.audioMetrics = null;
    $scope.streamMetrics = null;

    $scope.sessionID = $routeParams.session || undefined;

    $scope.imageQuality = null;

    $scope.imageIntraswitching = null;

    $scope.mpd;

    $scope.streamingSessionInfos = null;

    $scope.selectedItem = {};

    $scope.serverdocker = [];

    $scope.totalServers = [];

    $scope.putSimultaneousServers = function (number) {
        var destinationStats = BaseURL + "/api/unsecure/demo/numberservers/" + $scope.sessionID + "/" + number,
            config = {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            },
            data = {};
        $http.post(destinationStats, data, config)
            .success(function (data, status, headers, config) {
                $scope.numberOfServersUpdating = "Updating..."
                $scope.numberOfSimultaneousServers.model = number;
            })
            .error(function (data, status, header, config) {

            });
    }


    $scope.infosActivated = false;

    $scope.numberOfServersUpdating = "";
    
    $scope.mddashMetrics;


    $scope.numberOfSimultaneousServers = {
        model: initialServers,
        options: {
            id: 1,
            floor: 1,
            ceil: 9,
            step: 1,
            translate: function (value) {
                return value;
            },
            showSelectionBar: true,
            //getSelectionBarColor: 'black',
            //getPointerColor: 'black',
            onEnd: function (id, rzmodel, rzhigh) {
                var test = servers.filter(function (elem) {return (elem.state === "up" || elem.state === "updating");}).length;
                if (rzmodel > test) {
                    var numberToAdd = rzmodel - test;
                    var tableDown=servers.filter(function (elem) {return (elem.state === "down" || elem.state === "deleting");});
                    for(var k=0;k<numberToAdd;k++){
                        addServer(tableDown[k], tableDown[k].serverNum);
                    }
                }
                $scope.putSimultaneousServers(rzmodel);
            }
        }
    };


    $scope.infodata = {
        gop: " <p> Three servers are deployed with a 700Kbps to 3400Kbps upload capacity.</p><br/><p>Each server is hosting several representations</p><br/><p> The MS-Stream player is trying to simultaneously retrieve descriptions of the video (=video segments with some GOP in low quality, and others in the target quality) in the given number servers in order to merge them and display the highest possible content quality</p></br>",
        frame: "<ul>Three servers with 400 to 3000kbps upload capacity.</li><br/><li>Every server is hosting one different frame-based description.</li><br/><li> The MS-Stream player is trying to retrieve all of the three descriptions at the same time. Then, the player tries to merge the different descriptions in order to display a good quality. </li></ul>",
        classic: "<ul><li> One server with 800 to 2500kbps upload capacity.</li><br/><li>The server is hosting three different qualities of the same original video. </li><br/><li> The DASH player is trying to download the best quality possible for every segment. </ul>"
    };
    $scope.png = {
        classic: "app/img/DockArt2.png",
        frame: "app/img/DockArt1.png",
        gop: "app/img/DockArt3.png"
    };
    $scope.infoResult = {
        gop: "<p>According to the number of description retrieved for a given video segment the intrinsical segment quality could change</p><br/><p>When all the descriptions are collected, the highest possible video quality is displayed.</p><br/><p>Should some descriptions be too late for content playout, playback continuity is insured yet in sub-optimal quality</p>",
        frame: "<p>For one video segment, according to the number of description segments being retrieved, the displayed quality can change.</p><br/><p>If all of the three descriptions are collected for one segment, the best video quality is displayed.</p><br/><p>If some descriptions are missing for one segment, the displayed quality should be worst during the video segment. </p>",
        classic: "<p>The video segments are downloaded from one server. This server can deliver 3 different qualities for one segment.</p><br/><p>The quality is selected for every segment according to the bandwidth computed with the last segments and the buffer level.</p><br/><p>In this demonstration, the bandwidth of the server is limited. The 4000 kbps segments are not often downloaded.</p>"
    };

    $scope.disconnect = function () {
        removeSession("#/index/3");
    }
    $scope.reLoad = function () {
        //removeSession("#/player");
        $window.location.reload();
    }

    function getInfos() {
        getserverdocker();
        angular.forEach($scope.infos, function (value, key) {
            console.log(key + ': ' + value.title);
            if (value.title == $scope.selectedItem.url) {
//                $scope.infodata = value.item;
                $scope.png = value.img;
            }
        })
    }

    function getserverdocker() {
        sendMPD()

    }

    function sendMPD() {


        $http.get(BaseURL + "/api/unsecure/interfaces/session/" + $scope.sessionID)
            .success(function (data, status, headers, config) {
                var color = function (value) {
                    if (value <= 900)
                        return 'red';
                    if (value <= 1800)
                        return 'orange';
                    if (value <= 2500)
                        return 'yellow';
                    return '#2AE02A';
                };
                var currentNumberOfDes = 2;
                $scope.totalServers = [];

                $scope.serverdocker.interfaces = data;
                $scope.serverdocker.name = [];
                angular.forEach($scope.serverdocker.interfaces, function (value, key) {
                    $scope.serverdocker.name = $scope.serverdocker.name || [];
                    $scope.serverdocker.name.push({
                        "value": value.serverNumber,
                        "name": "server" + value.serverNumber,
                        "addr": value.address.replace("http://", ""),
                        "initialBandwidth": value.initialBitrate,
                        "serverNumber": value.serverNumber
                    });
                    $scope.serverdocker.name.sort(function(a,b){return a.serverNumber - b.serverNumber;})
                })

                $scope.imageQuality = "app/img/quality3des.jpg";


                angular.forEach($scope.serverdocker.name, function (value, key) {
                        //if (currentNumberOfDes === 3) {
                            $scope.slider[value.addr] = {
                                model: value.initialBandwidth,
                                options: {
                                    id: value.addr,
                                    floor: 400,
                                    ceil: 3400,
                                    step: 1000,
                                    translate: function (value) {
                                        if (value === 400) value = 700;
                                        return value + " kbps";
                                    },
                                    showSelectionBar: true,
                                    getSelectionBarColor: color,
                                    getPointerColor: color,
                                    onEnd: function (id, rzmodel, rzhigh) {
                                        if (rzmodel === 400) {
                                            rzmodel = 700;
                                        }
                                        $scope.limit(id, rzmodel);
                                    }
                                }
                            };
                        /*} else {
                            $scope.slider[value2.addr] = {
                                model: value2.initialBandwidth,
                                options: {
                                    id: value2.addr,
                                    floor: 500,
                                    ceil: 3500,
                                    step: 1000,
                                    translate: function (value) {
                                        return value + " kb/s";
                                    },
                                    showSelectionBar: true,
                                    getSelectionBarColor: color,
                                    getPointerColor: color,
                                    onEnd: function (id, rzmodel, rzhigh) {

                                        $scope.limit(id, rzmodel);
                                    }
                                }
                            };
                        }*/

                })

                angular.forEach($scope.serverdocker.name, function (value, key) {
                        $scope.limit(value.addr, value.initialBandwidth);//$scope.slider[value2.addr].model);

                })

            })
            .error(function (data, status, headers, config) {
                console.log("Failed");
            });

    }

    function pingServer() {
        var destinationStats = BaseURL + "/api/unsecure/demo/ping/" + $scope.sessionID,
            config = {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            },
            data = {};

        $http.post(destinationStats, data, config)
            .success(function (data, status, headers, config) {
                //console.log("ping ok");
            })
            .error(function (data, status, header, config) {
                console.log("error with ping");
                $window.location.assign("#/index/2");
                $window.location.reload();
            });
    }

    function removeSession(destination) {
        var destinationStats = BaseURL + "/api/unsecure/demo/remove/" + $scope.sessionID,
            config = {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            },
            data = {};

        $http.post(destinationStats, data, config)
            .success(function (data, status, headers, config) {
                console.log("removing ok");
                $window.location.assign(destination);
                $window.location.reload();
            })
            .error(function (data, status, header, config) {
                console.log("error with removing");
                console.log("removing ok");
                $window.location.assign(destination);
                $window.location.reload();
            });
    }

    $scope.$on('IdleStart', function () {
        console.log("idle started");
    });

    $scope.$on('IdleEnd', function () {
        console.log("idle ended");
    });

    $scope.$on('IdleTimeout', function () {
        console.log("idle timedout");
        removeSession("#/index/2");

    });

    $scope.limit = function (dockerid, bitrate) {
        $http.post(BaseURL + "/api/unsecure/docker/" + dockerid + "/" + bitrate)
            .success(function (data, status, headers, config) {
                //console.log("success");
            })
            .error(function (data, status, headers, config) {
                console.log("Failed");
            });
    }


    $scope.getVideoTreeMetrics = function () {
        var metrics = player.getMetricsFor("video");
        if (metrics) {
            $scope.videoMetrics = converter.toTreeViewDataSource(metrics);
        }
    }

    $scope.getAudioTreeMetrics = function () {
        var metrics = player.getMetricsFor("audio");
        if (metrics) {
            $scope.audioMetrics = converter.toTreeViewDataSource(metrics);
        }
    }

    $scope.getStreamTreeMetrics = function () {
        var metrics = player.getMetricsFor("stream");
        if (metrics) {
            $scope.streamMetrics = converter.toTreeViewDataSource(metrics);
        }
    }

    // from: https://gist.github.com/siongui/4969449
    $scope.safeApply = function (fn) {
        var phase = this.$root.$$phase;
        if (phase == '$apply' || phase == '$digest')
            this.$eval(fn);
        else
            this.$apply(fn);
    };

    function getCribbedMetricsFor(type) {
        var metrics = player.getMetricsFor(type),
            dashMetrics = player.getDashMetrics(),
            repSwitch,
            bufferLevel,
            httpRequests,
            droppedFramesMetrics,
            bitrateIndexValue,
            bandwidthValue,
            pendingValue,
            numBitratesValue,
            bufferLengthValue = 0,
            point,
            movingLatency = {},
            movingDownload = {},
            movingRatio = {},
            droppedFramesValue = 0,
            requestsQueue,
            fillmoving = function (type, Requests) {
                var requestWindow,
                    downloadTimes,
                    latencyTimes,
                    durationTimes;

                requestWindow = Requests
                    .slice(-20)
                    .filter(function(req){return req.responsecode >= 200 && req.responsecode < 300 && !!req._mediaduration && req.type === "MediaSegment" && req._stream === type;})
                    .slice(-4);
                if (requestWindow.length > 0) {

                    latencyTimes = requestWindow.map(function (req){ return Math.abs(req.tresponse.getTime() - req.trequest.getTime()) / 1000;});

                    movingLatency[type] = {
                        average: latencyTimes.reduce(function(l, r) {return l + r;}) / latencyTimes.length,
                        high: latencyTimes.reduce(function(l, r) {return l < r ? r : l;}),
                        low: latencyTimes.reduce(function(l, r) {return l < r ? l : r;}),
                        count: latencyTimes.length
                    };

                    downloadTimes = requestWindow.map(function (req){ return Math.abs(req._tfinish.getTime() - req.tresponse.getTime()) / 1000;});

                    movingDownload[type] = {
                        average: downloadTimes.reduce(function(l, r) {return l + r;}) / downloadTimes.length,
                        high: downloadTimes.reduce(function(l, r) {return l < r ? r : l;}),
                        low: downloadTimes.reduce(function(l, r) {return l < r ? l : r;}),
                        count: downloadTimes.length
                    };

                    durationTimes = requestWindow.map(function (req){ return req._mediaduration;});

                    movingRatio[type] = {
                        average: (durationTimes.reduce(function(l, r) {return l + r;}) / downloadTimes.length) / movingDownload[type].average,
                        high: durationTimes.reduce(function(l, r) {return l < r ? r : l;}) / movingDownload[type].low,
                        low: durationTimes.reduce(function(l, r) {return l < r ? l : r;}) / movingDownload[type].high,
                        count: durationTimes.length
                    };
                }
            };

        if (metrics && dashMetrics) {
            repSwitch = dashMetrics.getCurrentRepresentationSwitch(metrics);
            bufferLevel = dashMetrics.getCurrentBufferLevel(metrics);
            httpRequests = dashMetrics.getHttpRequests(metrics);
            droppedFramesMetrics = dashMetrics.getCurrentDroppedFrames(metrics);
            requestsQueue = dashMetrics.getRequestsQueue(metrics);

            fillmoving("video", httpRequests);
            fillmoving("audio", httpRequests);

            var streamIdx = $scope.streamInfo.index;

            if (repSwitch !== null) {
                bitrateIndexValue = dashMetrics.getIndexForRepresentation(repSwitch.to, streamIdx);
                bandwidthValue = dashMetrics.getBandwidthForRepresentation(repSwitch.to, streamIdx);
                bandwidthValue = bandwidthValue / 1000;
                bandwidthValue = Math.round(bandwidthValue);
            }

            numBitratesValue = dashMetrics.getMaxIndexForBufferType(type, streamIdx);

            if (bufferLevel !== null) {
                bufferLengthValue = bufferLevel.toPrecision(5);
            }

            if (droppedFramesMetrics !== null) {
                droppedFramesValue = droppedFramesMetrics.droppedFrames;
            }

            if (isNaN(bandwidthValue) || bandwidthValue === undefined) {
                bandwidthValue = 0;
            }

            if (isNaN(bitrateIndexValue) || bitrateIndexValue === undefined) {
                bitrateIndexValue = 0;
            }

            if (isNaN(numBitratesValue) || numBitratesValue === undefined) {
                numBitratesValue = 0;
            }

            if (isNaN(bufferLengthValue) || bufferLengthValue === undefined) {
                bufferLengthValue = 0;
            }

            pendingValue = player.getQualityFor(type);

            return {
                bandwidthValue: bandwidthValue,
                bitrateIndexValue: bitrateIndexValue + 1,
                pendingIndex: (pendingValue !== bitrateIndexValue) ? "(-> " + (pendingValue + 1) + ")" : "",
                numBitratesValue: numBitratesValue,
                bufferLengthValue: bufferLengthValue,
                droppedFramesValue: droppedFramesValue,
                movingLatency: movingLatency,
                movingDownload: movingDownload,
                movingRatio: movingRatio,
                requestsQueue: requestsQueue
            }
        }
        else {
            return null;
        }
    }

    function processManifestUpdateMetrics(metrics) {
        var data = $scope.manifestUpdateInfo || [],
            manifestInfo = metrics.ManifestUpdate,
            propsWithDelta = ["requestTime", "fetchTime", "availabilityStartTime", "presentationStartTime", "clientTimeOffset", "currentTime", "latency"],
            ln = manifestInfo.length,
            hasValue,
            info,
            prop,
            value,
            item,
            delta,
            k,
            ranges,
            range,
            rangeLn,
            prevInfo,
            stream,
            track,
            prevStream,
            prevTrack,
            isUpdate = (data.length === ln),
            i = Math.max(ln - 1, 0);

        if (ln === 0) return null;

        for (i; i < ln; i += 1) {
            info = manifestInfo[i];
            item = {};

            for (prop in info) {
                prevInfo = data[i - 1];

                if (isUpdate) {
                    item = data[i];
                }

                value = info[prop];
                hasValue = (value !== null) && (value !== undefined);

                if (typeof value === "number") {
                    value = value.toFixed(2);
                }

                item[prop] = hasValue ? value : " - ";

                if (propsWithDelta.indexOf(prop) === -1 || !hasValue || !prevInfo) continue;

                delta = value - prevInfo[prop];

                if (value instanceof(Date)) {
                    delta /= 1000;
                }

                item[prop + "Delta"] = "(" + delta.toFixed(2) + ")";
            }

            ranges = item.buffered;

            if (ranges && ranges.length > 0) {
                rangeLn = ranges.length;
                item.buffered = [];
                for (k = 0; k < rangeLn; k += 1) {
                    range = {};
                    range.start = ranges.start(k).toFixed(2);
                    range.end = ranges.end(k).toFixed(2);
                    range.size = (range.end - range.start).toFixed(2);
                    item.buffered.push(range);
                }
            } else {
                item.buffered = [{start: "-", end: "-", size: "-"}];
            }

            for (k = 0; k < info.streamInfo.length; k += 1) {
                stream = item.streamInfo[k];

                if (!prevInfo) break;

                prevStream = prevInfo.streamInfo[k];

                if (!prevStream) continue;

                stream.startDelta = "(" + (stream.start - prevStream.start).toFixed(2) + ")";
                stream.durationDelta = "(" + (stream.duration - prevStream.duration).toFixed(2) + ")";
            }

            for (k = 0; k < info.trackInfo.length; k += 1) {
                track = item.trackInfo[k];

                if (!prevInfo) break;

                prevTrack = prevInfo.trackInfo[k];

                if (!prevTrack) continue;

                track.startNumberDelta = "(" + (track.startNumber - prevTrack.startNumber) + ")";
                track.presentationTimeOffsetDelta = "(" + (track.presentationTimeOffset - prevTrack.presentationTimeOffset).toFixed(2) + ")";
            }

            if (isUpdate) continue;

            data.push(item);
        }

        return data;
    }

    function metricChanged(e) {
        var metrics,
            point,
            treeData,
            bufferedRanges = [];

        // get current buffered ranges of video element and keep them up to date
        for (var i = 0; i < video.buffered.length; i++) {
            bufferedRanges.push(video.buffered.start(i) + ' - ' + video.buffered.end(i));
        }
        $scope.bufferedRanges = bufferedRanges;

        if (e.mediaType == "video") {
            metrics = getCribbedMetricsFor("video");
            if (metrics) {
                $scope.videoBitrate = metrics.bandwidthValue;
                $scope.videoIndex = metrics.bitrateIndexValue;
                $scope.videoPendingIndex = metrics.pendingIndex;
                $scope.videoMaxIndex = metrics.numBitratesValue;
                $scope.videoBufferLength = metrics.bufferLengthValue;
                $scope.videoDroppedFrames = metrics.droppedFramesValue;
                $scope.videoRequestsQueue = metrics.requestsQueue;
                if (metrics.movingLatency["video"]) {
                    $scope.videoLatencyCount = metrics.movingLatency["video"].count;
                    $scope.videoLatency = metrics.movingLatency["video"].low.toFixed(3) + " < " + metrics.movingLatency["video"].average.toFixed(3) + " < " + metrics.movingLatency["video"].high.toFixed(3);
                }
                if (metrics.movingDownload["video"]) {
                    $scope.videoDownloadCount = metrics.movingDownload["video"].count;
                    $scope.videoDownload = metrics.movingDownload["video"].low.toFixed(3) + " < " + metrics.movingDownload["video"].average.toFixed(3) + " < " + metrics.movingDownload["video"].high.toFixed(3);
                }
                if (metrics.movingRatio["video"]) {
                    $scope.videoRatioCount = metrics.movingRatio["video"].count;
                    $scope.videoRatio = metrics.movingRatio["video"].low.toFixed(3) + " < " + metrics.movingRatio["video"].average.toFixed(3) + " < " + metrics.movingRatio["video"].high.toFixed(3);
                }

                point = [parseFloat(video.currentTime), Math.round(parseFloat(metrics.bufferLengthValue))];
                videoSeries.push(point);

                if (videoSeries.length > maxGraphPoints) {
                    videoSeries.splice(0, 1);
                }
            }
        }

        if (e.mediaType == "audio") {
            metrics = getCribbedMetricsFor("audio");
            if (metrics) {
                $scope.audioBitrate = metrics.bandwidthValue;
                $scope.audioIndex = metrics.bitrateIndexValue;
                $scope.audioPendingIndex = metrics.pendingIndex;
                $scope.audioMaxIndex = metrics.numBitratesValue;
                $scope.audioBufferLength = metrics.bufferLengthValue;
                $scope.audioDroppedFrames = metrics.droppedFramesValue;
                $scope.audioRequestsQueue = metrics.requestsQueue;
                if (metrics.movingLatency["audio"]) {
                    $scope.audioLatencyCount = metrics.movingLatency["audio"].count;
                    $scope.audioLatency = metrics.movingLatency["audio"].low.toFixed(3) + " < " + metrics.movingLatency["audio"].average.toFixed(3) + " < " + metrics.movingLatency["audio"].high.toFixed(3);
                }
                if (metrics.movingDownload["audio"]) {
                    $scope.audioDownloadCount = metrics.movingDownload["audio"].count;
                    $scope.audioDownload = metrics.movingDownload["audio"].low.toFixed(3) + " < " + metrics.movingDownload["audio"].average.toFixed(3) + " < " + metrics.movingDownload["audio"].high.toFixed(3);
                }
                if (metrics.movingRatio["audio"]) {
                    $scope.audioRatioCount = metrics.movingRatio["audio"].count;
                    $scope.audioRatio = metrics.movingRatio["audio"].low.toFixed(3) + " < " + metrics.movingRatio["audio"].average.toFixed(3) + " < " + metrics.movingRatio["audio"].high.toFixed(3);
                }

                point = [parseFloat(video.currentTime), Math.round(parseFloat(metrics.bufferLengthValue))];
                audioSeries.push(point);

                if (audioSeries.length > maxGraphPoints) {
                    audioSeries.splice(0, 1);
                }
            }
        }

        $scope.invalidateDisplay(true);
        $scope.safeApply();
    }

    function metricUpdated(e) {
        var metrics = player.getMetricsFor("stream"),
            data;

        if (!e.metric || e.metric.indexOf("ManifestUpdate") === -1 || !metrics) return;

        data = processManifestUpdateMetrics(metrics);

        if (!data) return;

        $scope.manifestUpdateInfo = data;
        $scope.invalidateDisplay(true);
        $scope.safeApply();
    }

    function streamSwitch(e) {
        $scope.streamInfo = e.toStreamInfo;
    }

    function streamInitialized(e) {
        var availableTracks = {};
        availableTracks.audio = player.getTracksFor("audio");
        availableTracks.video = player.getTracksFor("video");
        $scope.availableTracks = availableTracks;
    }

    ////////////////////////////////////////
    //
    // Error Handling
    //
    ////////////////////////////////////////

    function onError(e) {

    }

    ////////////////////////////////////////
    //
    // Debugging
    //
    ////////////////////////////////////////

    $scope.invalidateChartDisplay = false;

    $scope.invalidateDisplay = function (value) {
        $scope.invalidateChartDisplay = value;
    }

    $scope.bufferData = [
        {
            data: videoSeries,
            label: "Video",
            color: "#2980B9"
        },
        {
            data: audioSeries,
            label: "Audio",
            color: "#E74C3C"
        }
    ];

    $scope.showCharts = false;
    $scope.setCharts = function (show) {
        $scope.showCharts = show;
    }

    $scope.setBufferLevelChart = function (show) {
        $scope.showBufferLevel = show;
    }

    $scope.showDebug = false;
    $scope.setDebug = function (show) {
        $scope.showDebug = show;
    }

    function manifestUpdated () {
        for (var i = 0; i < servers.length; i++) {
            if(servers[i].state === "updating") servers[i].state = "up";
            if(servers[i].state === "deleting") servers[i].state = "down";
            $scope.numberOfServersUpdating = "";
        }
    }

    function metricsMDdash (e) {
         var destinationStats ="http://" + urlLogServer + "/api/logs/adddecision",
         config = {
             headers : {
                 'Content-Type': 'application/json'
             }
         },
         data = e.requests;
         for(var i in data) {
        	 data[i].sessionId = $scope.sessionID;
         }

         nereusMOSService.postStats(data);
         $scope.mddashMetrics = data;
    	 
        /*$http.post(destinationStats, data, config)
        .success(function (data, status, headers, config) {

        })
        .error(function (data, status, header, config) {
            $http.get(BaseURL + "/api/unsecure/logs/addr")
                .success(function(data){
                    urlLogServer = data;
                })
                .error(function(data){

                })
        });*/
    	
    }

    function emptyBuffer (e) {
        var date = new Date();
        if (e.type == "bufferstalled") {
            currentEmptyBufferEvent = {
                date_begin: date.getTime(),
                date_end: null,
                duration: null
            }
            nereusMOSService.postEmptyBufferEvents(currentEmptyBufferEvent);
        } else {
            if (currentEmptyBufferEvent !== null) {
                currentEmptyBufferEvent["date_end"] = date.getTime();
                currentEmptyBufferEvent["duration"] = currentEmptyBufferEvent["date_end"] - currentEmptyBufferEvent["date_begin"];
                nereusMOSService.putEmptyBufferEvents(currentEmptyBufferEvent);
                currentEmptyBufferEvent = null;
            }
        }
        
    }
    ////////////////////////////////////////
    //
    // Player Setup
    //
    ////////////////////////////////////////

    video = document.querySelector(".dash-video-player video");
    player = dashjs.MediaPlayer().create();

    $scope.version = player.getVersion();

    player.initialize();
    player.getDebug().setLogToBrowserConsole(false);
    player.on(dashjs.MediaPlayer.events.ERROR, onError.bind(this));
    player.on(dashjs.MediaPlayer.events.METRIC_CHANGED, metricChanged.bind(this));
    player.on(dashjs.MediaPlayer.events.METRIC_UPDATED, metricUpdated.bind(this));
    player.on(dashjs.MediaPlayer.events.PERIOD_SWITCH_COMPLETED, streamSwitch.bind(this));
    player.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, streamInitialized.bind(this));
    player.on(dashjs.MediaPlayer.events.MANIFEST_LOADED, manifestUpdated.bind(this));
    player.on(dashjs.MediaPlayer.events.METRICS_MDDASH, metricsMDdash.bind(this));
    player.on(dashjs.MediaPlayer.events.BUFFER_EMPTY, emptyBuffer.bind(this));
    player.on(dashjs.MediaPlayer.events.BUFFER_LOADED, emptyBuffer.bind(this));
    player.attachView(video);
    player.attachVideoContainer(document.getElementById("videoContainer"));

    // Add HTML-rendered TTML subtitles except for Firefox (issue #1164)
    if (typeof navigator !== 'undefined' && !navigator.userAgent.match(/Firefox/)) {
        ttmlDiv = document.querySelector("#video-caption");
        player.attachTTMLRenderingDiv(ttmlDiv);
    }

    player.setAutoPlay(true);
    $scope.player = player;
//  controlbar = new ControlBar(player);
//  controlbar.initialize();
//  controlbar.disable() //controlbar.hide() // other option

    ////////////////////////////////////////
    //
    // Player Methods
    //
    ////////////////////////////////////////

    $scope.abrEnabled = true;

    $scope.setAbrEnabled = function (enabled) {
        $scope.abrEnabled = enabled;
        player.setAutoSwitchQuality(enabled);
    }

    $scope.bolaEnabled = false;

    $scope.setBolaEnabled = function (enabled) {
        $scope.bolaEnabled = enabled;
        player.enableBufferOccupancyABR(enabled);
    }

    $scope.abrUp = function (type) {
        var newQuality,
            dashMetrics = player.getDashMetrics(),
            max = dashMetrics.getMaxIndexForBufferType(type, $scope.streamInfo.index);

        newQuality = player.getQualityFor(type) + 1;
        // zero based
        if (newQuality >= max) {
            newQuality = max - 1;
        }
        player.setQualityFor(type, newQuality);
    }

    $scope.abrDown = function (type) {
        var newQuality = player.getQualityFor(type) - 1;
        if (newQuality < 0) {
            newQuality = 0;
        }
        player.setQualityFor(type, newQuality);
    }

    ////////////////////////////////////////
    //
    // Page Setup
    //
    ////////////////////////////////////////

    function getUrlVars() {
        var vars = {};
        var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
            vars[key] = value;
        });
        return vars;
    }

    // Get url params...
    var vars = getUrlVars();

    $scope.setStream = function (item) {
        $scope.selectedItem = item;
    }

    $scope.doLoad = function () {
        var protData = null;
        if ($scope.selectedItem.hasOwnProperty("protData")) {
            protData = $scope.selectedItem.protData;
        }
        player.setProtectionData(protData);
        player.attachSource($scope.selectedItem.url);
        player.setAutoSwitchQuality(false);
        player.enableBufferOccupancyABR(false);
        player.setBufferTimeAtTopQuality(timeMaxBuffer);
        player.setBufferTimeAtTopQualityLongForm(timeMaxBuffer);
        getInfos();
//      controlbar.reset();
//      controlbar.enable();

        if ($scope.initialSettings.audio) {
            player.setInitialMediaSettingsFor("audio", {lang: $scope.initialSettings.audio});
        }
        if ($scope.initialSettings.video) {
            player.setInitialMediaSettingsFor("video", {role: $scope.initialSettings.video});
        }

        $scope.manifestUpdateInfo = null;
        intervalQualityStats = setInterval(parseQualityStats, 1000);
    }

    $scope.switchTrack = function (track, type) {
        if (!track || (track === player.getCurrentTrackFor(type))) return;

        player.setCurrentTrack(track);
    }

    $scope.changeTrackSwitchMode = function (mode, type) {
        player.setTrackSwitchModeFor(type, mode);
    }

    $scope.initialSettings = {audio: null, video: null};
    $scope.mediaSettingsCacheEnabled = true;

    $scope.setMediaSettingsCacheEnabled = function (enabled) {
        $scope.mediaSettingsCacheEnabled = enabled;
        player.enableLastMediaSettingsCaching(enabled);
    }

    $scope.hasLogo = function (item) {
        return (item.hasOwnProperty("logo")
        && item.logo !== null
        && item.logo !== undefined
        && item.logo !== "");
    }

    // Get initial stream if it was passed in.
    var paramUrl = null;

    if (vars && vars.hasOwnProperty("url")) {
        paramUrl = vars.url;
    }

    if (vars && vars.hasOwnProperty("mpd")) {
        paramUrl = vars.mpd;
    }

    if (paramUrl !== null) {
        var startPlayback = true;

        $scope.selectedItem = {};
        $scope.selectedItem.url = paramUrl;
        getInfos();
        if (vars.hasOwnProperty("autoplay")) {
            startPlayback = (vars.autoplay === 'true');
        }

        if (startPlayback) {
            $scope.doLoad();
        }
    }

    function parseQualityStats() {
        var result = player.getDecision(),
            estimatedBandwidth = player.getEstimatedBandwidth(),
            sumBandwidth = 0;
        $scope.streamingSessionInfos = result;
        $scope.representationUsed = result[0].maxQualityNumber + 1;
        $scope.representationTotal = result[0].numberOfQualities;
        $scope.allQualities = result[0].bitratelist;

        for(var i in links){
            links[i].visible = false;
            linksColor[i] = 'black';
            linksPercent[i].visible = false;
            graphServersBandwidths[i].content = "";
        }
        sumBandwidthClient.content = "";

        $scope.opQuality = Math.round(result[0].maxQuality / 1e6);
        for (var l in estimatedBandwidth) {
            for (var k = 0; k < $scope.serverdocker.name.length; k++) {
                if (l.indexOf($scope.serverdocker.name[k].addr) !== -1){
                    $scope.serverdocker.name[k].estimatedBandwidth = Math.round(estimatedBandwidth[l]);
                }
            }
        }

        for(var i=0; i<result.length; i++){
            var localColor = 'black';
            var servernum;
            var serverIndex;
            /////////////////////////////////////
            // Actual Server
            /////////////////////////////////////
            for (var j in $scope.serverdocker.name) {
                if(result[i].server.indexOf($scope.serverdocker.name[j].addr) !== -1) {
                    servernum = $scope.serverdocker.name[j].serverNumber - 1;
                    serverIndex = j;
                }
            }
            links[servernum].visible = true;
            linksPercent[servernum].visible = true;
            linksPercent[servernum].content = Math.floor(result[i].percent) + "%";
            /////////////////////////////////////
            // Colors
            /////////////////////////////////////

            if(result[0].maxQualityNumber <= 1/4 * (result[0].numberOfQualities-1)) {
            	localColor = 'red';
            	linksPercent[servernum].fillColor = 'red';
            }
            if(result[0].maxQualityNumber > 1/4 * (result[0].numberOfQualities-1)) {
            	localColor = 'orange';
            	linksPercent[servernum].fillColor = 'orange';
            }
            if(result[0].maxQualityNumber > 1/2 * (result[0].numberOfQualities-1)) {
            	localColor = 'yellow';
            	linksPercent[servernum].fillColor = '#B18904';
            }
            if(result[0].maxQualityNumber > 3/4 * (result[0].numberOfQualities-1)) {
            	localColor = 'green';
            	linksPercent[servernum].fillColor = 'green';
            }
            linksColor[servernum]=localColor;

            ///////////////////////////////////////
            // bandwidth
            ///////////////////////////////////////
            if($scope.serverdocker.name[serverIndex].estimatedBandwidth) graphServersBandwidths[servernum].content = $scope.serverdocker.name[serverIndex].estimatedBandwidth + " kbps";
            sumBandwidth += +$scope.serverdocker.name[serverIndex].estimatedBandwidth;
        }
        if($scope.serverdocker.name[serverIndex].estimatedBandwidth && !isNaN(sumBandwidth)) sumBandwidthClient.content = sumBandwidth + " kbps";

        //////////////////////////////////////////////////////////////////////////
        //
        // Charts
        //
        //////////////////////////////////////////////////////////////////////////
        if(!initialDate) {
            initialDate = new Date();
        }
        var actualDate = Math.floor((new Date().getTime() - initialDate.getTime())/1000);

        // Video bitrate
        chartQuality.data.datasets[0].data.push({
            x: actualDate,
            y: Math.floor((result[0].maxQuality)/100000)/10
        })
        // Sum bandwidth client
        chartQuality.data.datasets[1].data.push({
            x: actualDate,
            y: Math.floor((sumBandwidth)/100)/10
        })

        // Number Of server
        chartNumberOfServers.data.datasets[0].data.push({
            x: actualDate,
            y: result.length
        })

        // Buffer
        chartBuffer.data.datasets[0].data.push({
            x: actualDate,
            y: $scope.videoBufferLength
        })
        // Limit Buffer
        chartBuffer.data.datasets[1].data.push({
            x: actualDate,
            y: timeMaxBuffer+8
        })
        if($scope.infosActivated) {
            chartQuality.update();
            chartNumberOfServers.update();
            chartBuffer.update();
        }
        //////////////////////////////////////////////////////////////////////////
        //////////////////////////////////////////////////////////////////////////
    }

    /////////////////////////////////////////////////////////////
    //
    // Validate sessionID
    //
    /////////////////////////////////////////////////////////////

    function testSession() {
        var destinationStats = BaseURL + "/api/unsecure/demo/session/" + $scope.sessionID,
            config = {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            },
            data = {};

        $http.get(destinationStats, data, config)
            .success(function (data, status, headers, config) {
                console.log("Good Session");
                $scope.videoName = data.videoName;
                $scope.selectedItem.url = destinationStats + "/mpd";
                $scope.selectedItem.type = "gop";
                $scope.doLoad();
            })
            .error(function (data, status, header, config) {
                $window.location.assign("#/index/1");
                $window.location.reload();
            });
    }

    testSession();


    function addServer(server, serverNum) {
        var destinationStats = BaseURL + "/api/unsecure/demo/addserver/" + $scope.sessionID + "/" + serverNum,
            config = {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            },
            data = {};

        $http.post(destinationStats, data, config)
            .success(function (data, status, headers, config) {
                console.log("server added");
                server.state = "updating";
            })
            .error(function (data, status, header, config) {

            });
    }

    function delServer(server, serverNum) {
        var destinationStats = BaseURL + "/api/unsecure/demo/removeserver/" + $scope.sessionID + "/" + serverNum,
            config = {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            },
            data = {};

        $http.post(destinationStats, data, config)
            .success(function (data, status, headers, config) {
                console.log("server added");
                server.state = "deleting";
            })
            .error(function (data, status, header, config) {

            });
    }

    $scope.chooseServer = function(name) {
        for (var i in servers) {
            if (graphServersNames[i].content === name && servers[i].opacity === 1) return true;
        }
        return false;
    }

    /////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////
    paper.install(window);
    paper.setup('myCanvas');
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /**
     * Created by mlacaud on 04/05/16.
     */

    var radiusBase = 230,
        radiusUpLink = radiusBase - 50,
        radiusDownLink = radiusBase - 165,
        radiusTopServer = radiusBase + 60,
        radiusTopSlider = radiusBase + 90,
        radiusTextDescription = radiusBase + 130,
        radiusTextDescription2 = radiusBase + 175,
        radiusPercent = radiusBase - 120,
        links = [],
        linksColor = [],
        linksPercent = [],
        graphServersNames = [],
        graphServersBandwidths = [],
        sumBandwidthClient,
        pointCenterRight = new Point(view.center.x + 130, view.center.y),
        sliders = [],
        arcs = [];

///////////////////////////////////
// Base circle
///////////////////////////////////
    var path = new Path.Circle({
        center: pointCenterRight,
        radius: radiusBase,
        strokeColor: 'black',
    });
    //path.selected = true;
    //path.flatten(radiusBase*2*3.14/8);
    path.visible = false;


    var path2 = new Path.Circle({
        center: pointCenterRight,
        radius: radiusUpLink,
        strokeColor: 'black',
    });
    path2.visible = false;


    var path3 = new Path.Circle({
        center: pointCenterRight,
        radius: radiusDownLink,
        strokeColor: 'black',
    });
    path3.visible = false;


    var path4 = new Path.Circle({
        center: pointCenterRight,
        radius: radiusTopServer,
        strokeColor: 'black',
    });
    path4.visible = false;


    var path5 = new Path.Circle({
        center: pointCenterRight,
        radius: radiusTopSlider,
        strokeColor: 'black',
    });
    path5.visible = false;

    var path6 = new Path.Circle({
        center: pointCenterRight,
        radius: radiusTextDescription,
        strokeColor: 'black',
    });
    path6.visible = false;

    var path7 = new Path.Circle({
        center: pointCenterRight,
        radius: radiusTextDescription2,
        strokeColor: 'black',
    });
    path7.visible = false;
    
    var path8 = new Path.Circle({
        center: pointCenterRight,
        radius: radiusPercent,
        strokeColor: 'black',
    });
    path8.visible = false;
///////////////////////////////////
// Man
///////////////////////////////////
    var man = new Raster('programmer');
    man.scale(0.6);

    var legendPaper = new Raster('legend');
    legendPaper.scale(1.2);

    var pointSumBandwidth = new Point(pointCenterRight.x, pointCenterRight.y + 60);
    sumBandwidthClient = new PointText({
        point: pointSumBandwidth,
        justification: 'center',
        fontSize: 20,
        fillColor: 'black',
        content: ""
    });

///////////////////////////////////
//
// Servers
//
///////////////////////////////////
    var servers = [],
        serverCount = 9,
        i,
        //serverOrig = new Raster('server'),
        server,
        graphServerName,
        graphServerBandwidth,
        linkPercent;
    for (i = 0; i < serverCount; i++) {
        var j = i + 1;
        /*if (i === 0) {
            server = serverOrig;
            server.scale(0.2);
        } else {
            server = serverOrig.clone();
        }*/
        server = new Raster('server' + (i+1));
        server.scale(0.6);
        server.serverNum = i + 1;
        server.onMouseEnter = function(event) {
            document.body.style.cursor='pointer';
        }
        server.onMouseLeave = function(event) {
            document.body.style.cursor='default';
        }
        if(i<3) server.serverDesc="1";
        if(i>=3 && i<6) server.serverDesc="2";
        if(i>=6 && i<9) server.serverDesc="3";
        
        //////////////////////////////////
        // Server names
        //////////////////////////////////
        var pointServerName = path.getPointAt(radiusBase * 2 * 3.14 * i / serverCount);
        graphServerName = new PointText({
            point: pointServerName,
            justification: 'center',
            fontSize: 20,
            fillColor: 'blue',
            content: "server" + (i + 1)
        });
        graphServerName.position.y = graphServerName.position.y+60;
        graphServersNames.push(graphServerName);

        ///////////////////////////////////
        // Server bandwidth
        ///////////////////////////////////
        var pointServerBandwidth = path.getPointAt(radiusBase * 2 * 3.14 * i / serverCount);
        graphServerBandwidth = new PointText({
            point: pointServerBandwidth,
            justification: 'center',
            fontSize: 20,
            fillColor: 'black',
            content: ""
        });
        graphServerBandwidth.position.y = graphServerBandwidth.position.y-55;
        graphServersBandwidths.push(graphServerBandwidth);
        
        ///////////////////////////////////
        // Links percent
        ///////////////////////////////////
        var pointLinkPercent = path8.getPointAt((radiusPercent * 2 * 3.14 * i / serverCount) + 20);
        linkPercent = new PointText({
            point: pointLinkPercent,
            justification: 'center',
            fontSize: 20,
            fillColor: 'green',
            content: "33%"
        });
        linkPercent.visible = false;
        linksPercent.push(linkPercent);
        
        ///////////////////////////////////
        // Links
        ///////////////////////////////////
        var pointUpLink = path2.getPointAt(radiusUpLink * 2 * 3.14 * i / serverCount),
            pointDownLink = path3.getPointAt(radiusDownLink * 2 * 3.14 * i / serverCount);
        var link = new Path.Line({
            from: pointUpLink,
            to: pointDownLink,
            strokeColor: {
                gradient: {
                    stops: ['#FAFAFA', '#A4A4A4', '#585858', '#424242', '#000000']
                },
                origin: pointUpLink,
                destination: pointDownLink
            },
            strokeWidth: 3
        });
        links.push(link);
        linksColor.push('black');



        ////////////////////////////////////
        // Server ok init
        ////////////////////////////////////
        if (i >= initialServers ) {
            server.opacity = 0.2;
            server.state = "down";
            link.visible = false;
            graphServerName.visible = false;
        } else {
            server.state = "up";
        }

        ////////////////////////////////////
        // onClick
        ////////////////////////////////////
        server.onClick = function (event) {
            if (this.state === "down") {
                addServer(this, this.serverNum);
            } else {
                delServer(this, this.serverNum);
            }
        }

        ////////////////////////////////////
        // Push
        ////////////////////////////////////
        servers.push(server);

    }

//////////////////////////////////////
//////////////////////////////////////

///////////////////////////////////
//
// Resize
//
///////////////////////////////////
    view.onResize = function(event) {

        pointCenterRight = new Point(view.center.x + 130, view.center.y);

        path.position = pointCenterRight;
        path2.position = pointCenterRight;
        path3.position = pointCenterRight;
        path4.position = pointCenterRight;
        path5.position = pointCenterRight;
        path6.position = pointCenterRight;
        path7.position = pointCenterRight;
        path8.position = pointCenterRight;
        man.position = pointCenterRight;
        legendPaper.position.x = view.bounds.point.x + 200;
        legendPaper.position.y = view.bounds.point.y + 150;
        sumBandwidthClient.position.x = pointCenterRight.x;
        sumBandwidthClient.position.y = pointCenterRight.y + 60;


        for (i = 0; i < serverCount; i++) {
            var j = i + 1;
            var pointServer = path.getPointAt(radiusBase * 2 * 3.14 * i / serverCount),
                pointUpLink = path2.getPointAt(radiusUpLink * 2 * 3.14 * i / serverCount),
                pointDownLink = path3.getPointAt(radiusDownLink * 2 * 3.14 * i / serverCount),
                pointLinkPercent = path8.getPointAt((radiusPercent * 2 * 3.14 * i / serverCount) + 20),
                pointServerName = path.getPointAt(radiusBase * 2 * 3.14 * i / serverCount),
                pointServerBandwidth = path.getPointAt(radiusBase * 2 * 3.14 * i / serverCount);

            pointServerName.y = pointServerName.y + 60;
            graphServersNames[i].setPoint(pointServerName);
            pointServerBandwidth.y = pointServerBandwidth.y - 55;
            graphServersBandwidths[i].setPoint(pointServerBandwidth);
            servers[i].position = pointServer;
            linksPercent[i].setPoint(pointLinkPercent);
            links[i].removeSegments();
            links[i].add(pointUpLink, pointDownLink);
        }
    };

    view.onFrame = function(event) {
        var refColors = ['black', 'green', 'orange', 'yellow', 'red'];
        refColors['black'] = ['#FAFAFA', '#A4A4A4', '#585858', '#424242', '#000000'];
        refColors['green'] = ['#0B610B', '#04B404', '#01DF01', '#00FF00', '#58FA58'];
        refColors['orange'] = ['#B43104', '#FF4000', '#DF7401', '#FF8000', '#FAAC58'];
        refColors['yellow'] = ['#B18904', '#FFBF00', '#FFFF00', '#F7FE2E', '#F3F781'];
        refColors['red'] = ['#8A0808', '#DF0101', '#FF0000', '#FA5858', '#F5A9A9'];

        for (var i = 0; i < serverCount; i++) {
            var changement = 50,
                totalColor = 5;
            if (event.count % changement < changement / totalColor) {
                links[i].strokeColor.gradient.stops[0].color = refColors[linksColor[i]][0];
                links[i].strokeColor.gradient.stops[1].color = refColors[linksColor[i]][1];
                links[i].strokeColor.gradient.stops[2].color = refColors[linksColor[i]][2];
                links[i].strokeColor.gradient.stops[3].color = refColors[linksColor[i]][3];
                links[i].strokeColor.gradient.stops[4].color = refColors[linksColor[i]][4];
                if (servers[i].state === "updating" || servers[i].state === "deleting") servers[i].opacity = 0.2;
            }
            if (event.count % changement >= changement / totalColor && event.count % changement < changement * 2 / totalColor) {
                links[i].strokeColor.gradient.stops[0].color = refColors[linksColor[i]][4];
                links[i].strokeColor.gradient.stops[1].color = refColors[linksColor[i]][0];
                links[i].strokeColor.gradient.stops[2].color = refColors[linksColor[i]][1];
                links[i].strokeColor.gradient.stops[3].color = refColors[linksColor[i]][2];
                links[i].strokeColor.gradient.stops[4].color = refColors[linksColor[i]][3];
                if (servers[i].state === "updating" || servers[i].state === "deleting") servers[i].opacity = 0.5;
            }
            if (event.count % changement >= changement * 2 / totalColor && event.count % changement < changement * 3 / totalColor) {
                links[i].strokeColor.gradient.stops[0].color = refColors[linksColor[i]][3];
                links[i].strokeColor.gradient.stops[1].color = refColors[linksColor[i]][4];
                links[i].strokeColor.gradient.stops[2].color = refColors[linksColor[i]][0];
                links[i].strokeColor.gradient.stops[3].color = refColors[linksColor[i]][1];
                links[i].strokeColor.gradient.stops[4].color = refColors[linksColor[i]][2];
                if (servers[i].state === "updating" || servers[i].state === "deleting") servers[i].opacity = 1;
            }
            if (event.count % changement >= changement * 3 / totalColor && event.count % changement < changement * 4 / totalColor) {
                links[i].strokeColor.gradient.stops[0].color = refColors[linksColor[i]][2];
                links[i].strokeColor.gradient.stops[1].color = refColors[linksColor[i]][3];
                links[i].strokeColor.gradient.stops[2].color = refColors[linksColor[i]][4];
                links[i].strokeColor.gradient.stops[3].color = refColors[linksColor[i]][0];
                links[i].strokeColor.gradient.stops[4].color = refColors[linksColor[i]][1];
                if (servers[i].state === "updating" || servers[i].state === "deleting") servers[i].opacity = 0.5;
            }
            if (event.count % changement >= changement * 4 / totalColor && event.count % changement < changement * 5 / totalColor) {
                links[i].strokeColor.gradient.stops[0].color = refColors[linksColor[i]][1];
                links[i].strokeColor.gradient.stops[1].color = refColors[linksColor[i]][2];
                links[i].strokeColor.gradient.stops[2].color = refColors[linksColor[i]][3];
                links[i].strokeColor.gradient.stops[3].color = refColors[linksColor[i]][4];
                links[i].strokeColor.gradient.stops[4].color = refColors[linksColor[i]][0];
                if (servers[i].state === "updating" || servers[i].state === "deleting") servers[i].opacity = 0.2;
            }
            if (servers[i].state === "updating") {
                graphServersNames[i].visible = true;
                graphServersNames[i].content = "Adding...";
            }
            if (servers[i].state === "deleting") {
                graphServersNames[i].visible = true;
                graphServersNames[i].content = "Removing...";
            }
            if (servers[i].state === "up") {
                graphServersNames[i].visible = true;
                graphServersNames[i].content = "server" + (i+1);
                servers[i].opacity = 1;
            }
            if (servers[i].state === "down") {
                graphServersNames[i].visible = false;
                servers[i].opacity = 0.2;
            }
        }
    };

    view.zoom = 0.55;

    view.onResize();
    view.draw;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    var parentGraph = document.getElementById('moving-graph');

    $scope.$watch(function(scope){return scope.infosActivated},function(infosActivated){
        if(infosActivated){
            parentGraph.style.position = 'absolute';
            parentGraph.style.bottom='25%';
            parentGraph.style.left='40%';
            parentGraph.style.right='1.7%';
            parentGraph.style.top='0';
            parentGraph.style.backgroundColor='rgba(255,255,255,0.7)';
            parentGraph.style.cursor='pointer'
        } else {
            parentGraph.style.position = 'absolute';
            parentGraph.style.bottom='92%';
            parentGraph.style.left='88%';
            parentGraph.style.right='1.7%';
            parentGraph.style.top='0';
            parentGraph.style.backgroundColor='rgba(255,255,255,0.7)';
            parentGraph.style.cursor='pointer';
        }
    })

    $scope.reverseInfosActivated = function() {
        if($scope.infosActivated)
            $scope.infosActivated=false;
        else
            $scope.infosActivated=true;
    }

    var ctxQuality = document.getElementById("chartQuality");
    var chartQuality = new Chart(ctxQuality, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Video bitrate',
                data: [],
                fill: false,
                lineTension: 0.1,
                backgroundColor: "rgba(255,0,0,0.4)",
                borderColor: "rgba(255,0,0,1)",
                borderCapStyle: 'butt',
                borderDash: [],
                borderDashOffset: 0.0,
                borderJoinStyle: 'miter',
                pointBorderColor: "rgba(255,0,0,1)",
                pointBackgroundColor: "#fff",
                pointBorderWidth: 1,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: "rgba(255,0,0,1)",
                pointHoverBorderColor: "rgba(220,220,220,1)",
                pointHoverBorderWidth: 2,
                pointRadius: 1,
                pointHitRadius: 10,
                spanGaps: false,
            },{
                label: 'Your download bitrate',
                data: [],
                fill: false,
                lineTension: 0.1,
                backgroundColor: "rgba(234,133,0,0.4)",
                borderColor: "rgba(234,133,0,1)",
                borderCapStyle: 'butt',
                borderDash: [],
                borderDashOffset: 0.0,
                borderJoinStyle: 'miter',
                pointBorderColor: "rgba(234,133,0,1)",
                pointBackgroundColor: "#fff",
                pointBorderWidth: 1,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: "rgba(234,133,0,1)",
                pointHoverBorderColor: "rgba(220,220,220,1)",
                pointHoverBorderWidth: 2,
                pointRadius: 1,
                pointHitRadius: 10,
                spanGaps: true,
            }]
        },
        options: {
            scales: {
                xAxes: [{
                    type: 'linear',
                    position: 'bottom',
                    beginAtZero: true,
                    ticks: {
                        suggestedMax: 30,
                        suggestedMin: 0
                    }
                }]
            }
        }
    });

    var ctxNumberOfServers = document.getElementById("chartNumberOfServers");
    var chartNumberOfServers = new Chart(ctxNumberOfServers, {
        type: 'line',
        data: {
            datasets: [{
                label: 'number of simultaneous servers',
                data: [],
                fill: false,
                lineTension: 0.1,
                backgroundColor: "rgba(0,0,255,0.4)",
                borderColor: "rgba(0,0,255,1)",
                borderCapStyle: 'butt',
                borderDash: [],
                borderDashOffset: 0.0,
                borderJoinStyle: 'miter',
                pointBorderColor: "rgba(0,0,255,1)",
                pointBackgroundColor: "#fff",
                pointBorderWidth: 1,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: "rgba(0,0,255,1)",
                pointHoverBorderColor: "rgba(220,220,220,1)",
                pointHoverBorderWidth: 2,
                pointRadius: 1,
                pointHitRadius: 10,
                spanGaps: false,
            }]
        },
        options: {
            scales: {
                xAxes: [{
                    type: 'linear',
                    position: 'bottom',
                    beginAtZero: true,
                    ticks: {
                        suggestedMax: 30,
                        suggestedMin: 0
                    }
                }],
                yAxes: [{
                    type: 'linear',
                    beginAtZero: true,
                    ticks: {
                        suggestedMax: 9,
                        suggestedMin: 0,
                        step: 1
                    }
                }]
            }
        }
    });
    var ctxBuffer = document.getElementById("chartBuffer");
    var chartBuffer = new Chart(ctxBuffer, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Buffer Video',
                data: [],
                fill: false,
                lineTension: 0.1,
                backgroundColor: "rgba(0,255,0,0.4)",
                borderColor: "rgba(0,255,0,1)",
                borderCapStyle: 'butt',
                borderDash: [],
                borderDashOffset: 0.0,
                borderJoinStyle: 'miter',
                pointBorderColor: "rgba(0,255,0,1)",
                pointBackgroundColor: "#fff",
                pointBorderWidth: 1,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: "rgba(0,255,0,1)",
                pointHoverBorderColor: "rgba(220,220,220,1)",
                pointHoverBorderWidth: 2,
                pointRadius: 1,
                pointHitRadius: 10,
                spanGaps: false,
            },
            {
                label: 'Buffer max (for demo purpose)',
                data: [],
                fill: false,
                lineTension: 0.1,
                backgroundColor: "rgba(234,133,0,0.4)",
                borderColor: "rgba(234,133,0,1)",
                borderCapStyle: 'butt',
                borderDash: [],
                borderDashOffset: 0.0,
                borderJoinStyle: 'miter',
                pointBorderColor: "rgba(234,133,0,1)",
                pointBackgroundColor: "#fff",
                pointBorderWidth: 1,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: "rgba(234,133,0,1)",
                pointHoverBorderColor: "rgba(220,220,220,1)",
                pointHoverBorderWidth: 2,
                pointRadius: 1,
                pointHitRadius: 10,
                spanGaps: true,
            }]
        },
        options: {
            scales: {
                xAxes: [{
                    type: 'linear',
                    position: 'bottom',
                    beginAtZero: true,
                    ticks: {
                        suggestedMax: 30,
                        suggestedMin: 0
                    }
                }]
            }
        }
    });

});