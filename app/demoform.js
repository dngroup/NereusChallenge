'use strict'

var app = angular.module('DemoForm', [
    'ngRoute',
    'ngSanitize'
]);

app.config(function($routeProvider) {
    $routeProvider.when('/index/:msg?', {
        templateUrl: '/demoForm.html',
        controller: 'FormController'
    });
});

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

app.controller('FormController', function($scope, $sce, $http, $window, $routeParams, ShareService) {
    var iter = 0,
        interval= null,
        isDefaultSet = false,
        result=undefined;


    $scope.authors=[];
    $scope.contents = [];
    $scope.videoSelected = {};
    var BaseURL = "http://msstream.viotech.net"
    ////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Content from DB
    //
    ////////////////////////////////////////////////////////////////////////////////////////////

    var urlDBContent = BaseURL + "/api/unsecure/content/all";



    $http.get(urlDBContent)
        .success(function (data, status, headers, config) {
            //$scope.contents = data;
            result=data;
            for(var cont in result) {
                if($scope.authors.indexOf(result[cont].author) === -1) $scope.authors.push(result[cont].author);
            }

            $scope.contents=data;
            setInterval(function() {
                $scope.contents=result;
                $scope.$digest();
            }, 2000);
            //$scope.videoSelected = data[0];
            //ShareService.set(data[0]);
        })
        .error(function (data, status, header, config) {
        });
   // $scope.$watch(function(scope){return ShareService.set(scope.videoSelected);}, $scope.contents, true);


    $scope.launchThisVideo = function(videoName){
        ShareService.set(videoName);
        $window.location.assign("/#/player");
        //$window.location.reload();
    }
    ////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////

    var msg = $routeParams.msg || "";

    $scope.printedMsg = "";

    $scope.provideErrorMsg = function(){
        var result = true;
        switch(msg) {
            case "1":
                $scope.printedMsg = "This session does not exist. Please fill the form to create a new one."
                break;
            case "2":
                $scope.printedMsg = "You were idle too long. Your session has been removed. Please create a new one by filling the above formular again."
                break;
            case "4":
                $scope.printedMsg = "There is no server available for your demo. Please try again later."
                break;
            default:
                result=false;
        }
        return result;
    };

    $scope.provideSuccessMsg = function(){
        var result = true;
        switch(msg) {
            case "3":
                $scope.printedMsg = "Your session has been peacefully removed."
                break;
            default:
                result=false;
        }
        return result;
    };


    // Angular Side Object
    $scope.descriptions = [];

    $scope.sessionID = null;


    // Content selection Objects
    $scope.videoName = {
        videoName: "Big Buck Bunny"
    };

    $scope.contentForTheVideo = [];

    $scope.mdType = "gop";

    $scope.contentForTheType = [];

    $scope.numberOfDescriptions = 3;

    $scope.contentForTheDes = [];

    $scope.numberOfQualities = 3;

    $scope.qualities = [];


    /////////////////////////////////////////////////////////
    //
    // Get content from db
    //
    /////////////////////////////////////////////////////////
    $scope.contents = [];
    var destDBContent =BaseURL + "/api/unsecure/content/one/dngroup";

    $http.get(destDBContent)
        .success(function (data, status, headers, config) {
           $scope.contents = data;
        })
        .error(function (data, status, header, config) {
        });
    //////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////

    $scope.launchDemo = function(){
      var destinationStats =BaseURL + "/api/unsecure/demo/initialize",
          config = {
              headers : {
                  'Content-Type': 'application/json'
              }
          },
          data = {};

      data.qualities = $scope.qualities;
      data.descriptions = $scope.descriptions;

          $http.post(destinationStats, data, config)
              .success(function (data, status, headers, config) {
                  if(data.entity !== "All servers busy, please retry later.") {
                      $scope.sessionID = data.entity;
                      $window.location.assign("/#/player/" + $scope.sessionID);
                      $window.location.reload();
                  } else {
                      $window.location.assign("/#/demo/4");
                      $window.location.reload();
                  }

              })
              .error(function (data, status, header, config) {
                  $window.location.assign("/#/demo/4");
                  $window.location.reload();
              });
    };

    $scope.createSession=function(videoSelected){
        var  qualities = videoSelected.qualities || [406368 , 1007919, 1508655, 2008265, 3005440, 3999419, 5984284],
            servers = [
                {
                    "id": 1,
                    "bandwidth": 3200
                },
                {
                    "id": 2,
                    "bandwidth": 3200
                },
                {
                    "id": 3,
                    "bandwidth": 3200
                },
                /*{
                    "id": 4,
                    "bandwidth": 3200
                },
                {
                    "id": 5,
                    "bandwidth": 3200
                },
                {
                    "id": 6,
                    "bandwidth": 3200
                },
                {
                    "id": 7,
                    "bandwidth": 3200
                },
                {
                    "id": 8,
                    "bandwidth": 3200
                },
                {
                    "id": 9,
                    "bandwidth": 3200
                }*/
            ],
            numberOfServers = 3,
            videoName = videoSelected.ytbid||"Wings_to_paradise";

        var destinationStats = BaseURL + "/api/unsecure/demo/initialize",
            config = {
                headers : {
                    'Content-Type': 'application/json'
                }
            },
            data = {
                qualities: qualities,
                servers: servers,
                numberOfServers: numberOfServers,
                video: videoName
            };

        $http.post(destinationStats, data, config)
            .success(function (data, status, headers, config) {
                if(data.entity !== "All servers busy, please retry later.") {
                    $window.location.assign("/#/player/"+data.entity);
                    $window.location.reload();
                } else {
                    $window.location.assign("/#/index/4");
                    $window.location.reload();
                }

            })
            .error(function (data, status, header, config) {
                $window.location.assign("/#/index/4");
                $window.location.reload();
            });
    }

});

app.filter('unique', function () {

    return function (items, filterOn) {

        if (filterOn === false) {
            return items;
        }

        if ((filterOn || angular.isUndefined(filterOn)) && angular.isArray(items)) {
            var hashCheck = {}, newItems = [];

            var extractValueToCompare = function (item) {
                if (angular.isObject(item) && angular.isString(filterOn)) {
                    return item[filterOn];
                } else {
                    return item;
                }
            };

            angular.forEach(items, function (item) {
                var valueToCheck, isDuplicate = false;

                for (var i = 0; i < newItems.length; i++) {
                    if (angular.equals(extractValueToCompare(newItems[i]), extractValueToCompare(item))) {
                        isDuplicate = true;
                        break;
                    }
                }
                if (!isDuplicate) {
                    newItems.push(item);
                }

            });
            items = newItems;
        }
        return items;
    };
});
