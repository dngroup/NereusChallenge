/**
 * Created by mlacaud on 20/09/16.
 */
'use strict'
var app = angular.module('Doc', [
    'ngRoute',
    'ngSanitize'
]);

app.config(function($routeProvider) {
    $routeProvider.when('/doc', {
        templateUrl: '/doc.html',
        controller: 'DocController'
    });
});

app.controller('DocController', function($scope, $sce, $http, $window) {


});