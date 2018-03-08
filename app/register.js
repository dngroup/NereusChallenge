/**
 * Created by mlacaud on 03/05/16.
 */
'use strict'
var app = angular.module('Register', [
    'ngRoute',
    'ngSanitize'
]);

app.config(function($routeProvider) {
    $routeProvider.when('/register', {
        templateUrl: '/register.html',
        controller: 'RegisterController'
    });
});

app.controller('RegisterController', function($scope, $sce, $http) {

    $scope.register = function(user){
        $http.post('/api/register', user, {
            headers : {
                'Content-Type' : 'application/json'
            }
        }).success(function(response) {
            console.log("Created");
            var data = 'j_username=' + encodeURIComponent(user.name)
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
        }).error(function(response) {
            console.log("Failed");
        });
    }

});