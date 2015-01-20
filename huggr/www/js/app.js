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
        templateUrl: "templates/splash.html",
        controller: "loginCtrl"
    })

    .state('app', {
        url: "/app",
        abstract: true,
        templateUrl: "templates/menu.html",
    })

    .state('app.splash', {
        url: "/splash",
        views: {
            'menuContent': {
                controller: 'loginCtrl',
                templateUrl: "templates/splash.html"
            }
        }
    })

    .state('app.logout', {
        url: "/logout",
        views: {
            'menuContent': {
                controller: 'LogoutCtrl',
                templateUrl: "templates/logout.html"
            }
        }
    })

    .state('app.home', {
        url: "/home",
        views: {
            'menuContent': {
                templateUrl: "templates/home.html",
                controller: "homeCtrl",
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

    .state('app.results', {
        url: "/results/:male/:female/:range",
        views: {
            'menuContent': {
                templateUrl: "templates/results.html",
                controller: "resultCtrl",
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

    .state('app.profile', {
        url: "/profile",
        views: {
            'menuContent': {
                templateUrl: "templates/profile.html",
                controller: "ProfileCtrl",
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

    .state('app.settings', {
        url: "/settings",
        views: {
            'menuContent': {
                templateUrl: "templates/settings.html",
                controller: 'SettingsCtrl',
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

    .state('app.externalProfile', {
        url: "/profile/:profileID/:huggID",
        views: {
            'menuContent': {
                templateUrl: "templates/extprofile.html",
                controller: 'ExtProfileCtrl',
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

    .state('app.chatOverview', {
        url: "/chat",
        views: {
            'menuContent': {
                templateUrl: "templates/chatoverview.html",
                controller: 'ChatOverviewCtrl',
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

    .state('app.chat', {
        url: "/chat/:chatID/:chatTitle",
        views: {
            'menuContent': {
                templateUrl: "templates/chat.html",
                controller: 'ChatCtrl',
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
    
    .state('app.about', {
        url: "/about",
        views: {
            'menuContent': {
                templateUrl: "templates/about.html",
                controller: 'aboutCtrl',
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

    .state('app.adminlogin', {
        url: "/admin/login",
        views: {
            'menuContent': {
                templateUrl: "templates/admin/login.html",
                controller: 'adminloginCtrl',
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
    
    .state('app.adminsupportoverview', {
        url: "/admin/supportoverview",
        views: {
            'menuContent': {
                templateUrl: "templates/admin/supportoverview.html",
                controller: 'adminsupportoverviewCtrl',
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
    
     .state('app.adminsupportitem', {
        url: "/admin/supportitem/:supportID",
        views: {
            'menuContent': {
                templateUrl: "templates/admin/supportitem.html",
                controller: 'adminsupportitemCtrl',
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