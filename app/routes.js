/**
 * Created by mlacaud on 02/05/16.
 */
angular.module('DashContributorsService', ['ngResource']).
    factory('Contributors', function($resource){
        return $resource('app/contributors.json', {}, {
            query: {method:'GET', isArray:false}
        });
    });

angular.module('DashPlayerLibrariesService', ['ngResource']).
    factory('PlayerLibraries', function($resource){
        return $resource('app/player_libraries.json', {}, {
            query: {method:'GET', isArray:false}
        });
    });

angular.module('DashShowcaseLibrariesService', ['ngResource']).
    factory('ShowcaseLibraries', function($resource){
        return $resource('app/showcase_libraries.json', {}, {
            query: {method:'GET', isArray:false}
        });
    });


var routeApp = angular.module('routeApp', [
    'ngRoute',
    'ngCookies',
    'DemoForm',
    'DashPlayer',
    'LogIn',
    'Doc',
    //'Register',
    'DashContributorsService',
    'DashPlayerLibrariesService',
    'DashShowcaseLibrariesService',
    'ngSanitize'
]);
routeApp.config(
    [ '$routeProvider','$cookiesProvider', function($routeProvider, $cookiesProvider) {
        $routeProvider.otherwise({
            redirectTo : '/index'
        });
    } ]);


routeApp.controller("routeAppController", function($scope, $http, $cookies, $location, Contributors, PlayerLibraries, ShowcaseLibraries){
    var isAuthenticated = function(value){
            $http.get('/api/register/isauthenticated')
                .success(function(response) {
                    console.log("auth true")
                    $scope.authenticated = true;

                }).error(function(response) {
                    console.log("auth false");
                    $scope.authenticated = false;
                    
                });
        },
        updateCookie = function(){
            var newCookie = document.cookie;
            if($scope.cookie !== newCookie) $scope.cookie = newCookie;
        },
        interval = setInterval(updateCookie, 1000);
    $scope.cookie = "";

    $scope.testLocation = function() {
        if(location.href.indexOf('#/player') > -1)
            return true;

        return false;
    }

    //////////////////////////////////////////////////////////
    //
    // Contributors
    //
    //////////////////////////////////////////////////////////
    //Contributors + techno
    Contributors.query(function (data) {
        $scope.contributors = data.items;
    });

    PlayerLibraries.query(function (data) {
        $scope.playerLibraries = data.items;
    });

    ShowcaseLibraries.query(function (data) {
        $scope.showcaseLibraries = data.items;
    });
    $scope.hasLogo = function (item) {
        return (item.hasOwnProperty("logo")
        && item.logo !== null
        && item.logo !== undefined
        && item.logo !== "");
    };
    /////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////
    $scope.authenticated = false;

    //$scope.$watch(function(scope){return scope.cookie;}, isAuthenticated);

    $scope.logout = function(){
        $http.post('/api/logout', null, {
            headers : {
                'Content-Type' : 'application/x-www-form-urlencoded'
            }
        }).success(function(response) {
            console.log("Log out success")
        }).error(function(response) {
            console.log("Log out failed");
        });
    }
    


    /////////////////////////////////////////////////////////
    //
    // Graph tests
    //
    /////////////////////////////////////////////////////////



    /////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////


});

