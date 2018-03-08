/**
 * Created by mlacaud on 02/05/16.
 */
'use strict'
var app = angular.module('LogIn', [
    'ngRoute',
    'ngSanitize'
]);

app.config(function($routeProvider) {
    $routeProvider.when('/login', {
        templateUrl: '/login.html',
        controller: 'LogInController'
    });
});

app.controller('LogInController', function($scope, $sce, $http, $window) {

    $scope.login = function(user){
        var data = 'j_username=' + encodeURIComponent(user.username)
            + '&j_password=' + encodeURIComponent(user.password)
            + '&submit=Login';
        $http.post('/api/authentication', data, {
            headers : {
                'Content-Type' : 'application/x-www-form-urlencoded'
            }
        }).success(function(response) {
            if(response !== "error") {
                window.location.replace("#/admin");
                return response;
            }
        }).error(function(response) {
            console.log("Failed");
        });
    }

});
