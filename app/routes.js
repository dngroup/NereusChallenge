/**
 * Created by mlacaud on 02/05/16.
 */
var routeApp = angular.module('routeApp', [
    'ngRoute',
    'ngCookies',
    'DemoForm',
    'DashPlayer',
    'Doc',
    'ngSanitize'
]);
routeApp.config(
    [ '$routeProvider','$cookiesProvider', function($routeProvider, $cookiesProvider) {
        $routeProvider.otherwise({
            redirectTo : '/index'
        });
    } ]);


routeApp.controller("routeAppController", function($scope, $http, $cookies, $location){
    $scope.testLocation = function() {
        if(location.href.indexOf('#/player') > -1)
            return true;

        return false;
    }
    $scope.authenticated = false;
});