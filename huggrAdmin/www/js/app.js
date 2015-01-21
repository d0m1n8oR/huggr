// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'ngCordova', 'ngMap', 'firebase', 'ionic.rating'])

.run(function($ionicPlatform, $rootScope, $state, $firebase, $firebaseAuth, Auth, UserInfo) {
    $ionicPlatform.ready(function() {

        $rootScope.$on("$stateChangeError", function(event, toState, toParams, fromState, fromParams, error) {
            // We can catch the error thrown when the $requireAuth promise is rejected
            // and redirect the user back to the login page
            if (error === "AUTH_REQUIRED") {
                $state.go("index");
            }
        });
        $rootScope.Object = Object;
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleDefault();
        }
    });

})

.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider

    .state('index', {
        url: "/index",
        templateUrl: "templates/login.html",
        controller: "loginCtrl"
    })

    .state('app', {
        url: "/app",
        abstract: true,
        templateUrl: "templates/menu.html",
    })

    .state('app.login', {
        url: "/login",
        views: {
            'menuContent': {
                templateUrl: "templates/login.html",
                controller: 'loginCtrl',
                resolve: {
                    "currentAuth": ["Auth",
                        function(Auth) {
                            return Auth.$requireAuth();
                        }
                    ]
                }
            }
        }
    })
    
    .state('app.dashboard', {
        url: "/dashboard",
        views: {
            'menuContent': {
                templateUrl: "templates/dashboard.html",
                controller: 'dashboardCtrl',
                resolve: {
                    "currentAuth": ["Auth",
                        function(Auth) {
                            return Auth.$requireAuth();
                        }
                    ]
                }
            }
        }
    })

    .state('app.supportoverview', {
        url: "/supportoverview",
        views: {
            'menuContent': {
                templateUrl: "templates/supportoverview.html",
                controller: 'supportoverviewCtrl',
                resolve: {
                    "currentAuth": ["Auth",
                        function(Auth) {
                            return Auth.$requireAuth();
                        }
                    ]
                }
            }
        }
    })

    .state('app.supportitem', {
        url: "/supportitem/:supportID",
        views: {
            'menuContent': {
                templateUrl: "templates/supportitem.html",
                controller: 'supportitemCtrl',
                resolve: {
                    "currentAuth": ["Auth",
                        function(Auth) {
                            return Auth.$requireAuth();
                        }
                    ]
                }
            }
        }
    })
    
    .state('app.statistics', {
        url: "/statistics",
        views: {
            'menuContent': {
                templateUrl: "templates/statistics.html",
                controller: 'statisticsCtrl',
                resolve: {
                    "currentAuth": ["Auth",
                        function(Auth) {
                            return Auth.$requireAuth();
                        }
                    ]
                }
            }
        }
    })
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/index');
});