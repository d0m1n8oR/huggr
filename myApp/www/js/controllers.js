angular.module('starter.controllers', [])

.factory("Auth", ["$firebaseAuth", function($firebaseAuth) {
            var ref = new Firebase("https://huggr.firebaseio.com/");
            return $firebaseAuth(ref);
        }])

//Factory um UserInfos abzurufen
//Usage: UserInfo in den Controller injecten, dann im Code: UserInfo.getProfile(ProfileID);
.factory('UserInfo', ["$firebase", "user", function($firebase, user) {
        var ref = new Firebase("https://huggr.firebaseio.com/users/data");
        var dataRef = $firebase(ref).$asArray();
        return {
            getProfile: function(ID) {
                dataRef.$loaded()
                    .then(function(data) {
                        var record = data.$getRecord(ID);
                        var profileData = {
                            "profileID": record.profileID,
                            "displayName": record.displayName,
                            "email": record.email,
                            "picture": record.picture,
                            "birthdate": record.birthdate,
                            "age": record.age,
                            "hobby": record.hobby,
                            "gender": record.gender,
                            "firstname": record.firstname,
                            "lastname": record.lastname
                        };
                        return profileData;
                    })
                    .catch(function(error) {
                        console.error("Error getting UserInfo:", error);
                    });
            },
            setProfile: function(ID) {
                dataRef.$loaded()
                    .then(function(data) {
                        var record = data.$getRecord(ID);                        
                            user.profileID = record.profileID;
                            user.displayName = record.displayName;
                            user.email = record.email;
                            user.picture = record.picture;
                            user.birthdate = record.birthdate;
                            user.age = record.age;
                            user.hobby = record.hobby;
                            user.gender = record.gender;
                            user.firstname = record.firstname;
                            user.lastname = record.lastname;  
                    })
                    .catch(function(error) {
                        console.error("Error setting UserInfo:", error);
                    });
            }
        };
    }])

.value('user', {
    "profileID": "",
    "displayName": "",
    "email": "",
    "picture": "",
    "birthdate": "",
    "age": "",
    "hobby": "",
    "gender": "",
    "firstname": "",
    "lastname": ""
})


.controller('loginCtrl', function($scope, $firebase, $ionicModal, Auth, $state, user) {

    var ref = new Firebase("https://huggr.firebaseio.com/");
    var sync = $firebase(ref).$asObject();
    $scope.auth = Auth;

    $scope.check = $scope.auth.$getAuth();

    //create child for data
    $scope.dataRef = $firebase(ref.child("users").child("data")).$asArray();


    //create child for google
    $scope.googleRef = $firebase(ref.child("users").child("signin").child("google")).$asArray();
    $scope.facebookRef = $firebase(ref.child("users").child("signin").child("facebook")).$asArray();


    $scope.login = function(authProvider) {
        if (authProvider == "google") {

            ref.authWithOAuthPopup("google", function(err, authData) {
                if (authData) {


                    var userSigninIdentifier = authData.google.id;
                    if ($scope.googleRef.$getRecord(userSigninIdentifier) == null) {
                        console.warn("new user, registering...");
                        $scope.register(authProvider, authData);
                    } else {
                        $scope.profileID = $scope.googleRef.$getRecord(userSigninIdentifier).profileID;
                        $firebase(ref.child("users").child("signin").child("google").child(userSigninIdentifier)).$update({
                            token: authData.token,
                            expires: authData.expires,
                            AccessToken: authData.google.accessToken
                        });
                        $firebase(ref.child("users").child("data").child($scope.profileID)).$update({
                            displayName: authData.google.displayName,
                            email: authData.google.email,
                            picture: authData.google.cachedUserProfile.picture
                        });
                        console.log("Logged in as:", authData.uid);
                        var profileData = $scope.dataRef.$getRecord($scope.profileID);

                        user.profileID = profileData.profileID,
                            user.displayName = profileData.displayName,
                            user.email = profileData.email,
                            user.picture = profileData.picture,
                            user.birthdate = profileData.birthdate,
                            user.age = profileData.age,
                            user.hobby = profileData.hobby,
                            user.gender = profileData.gender,
                            user.firstname = profileData.firstname,
                            user.lastname = profileData.lastname
                        console.log(user);
                        $state.go('app.home');
                    }
                }
                if (err) {
                    console.log("error");
                }
            }, {
                scope: "email"
            });

        }
        if (authProvider == "facebook") {

            $scope.auth.$authWithOAuthPopup("facebook").then(function(authData) {

                var userSigninIdentifier = authData.facebook.id;
                console.log("userSigninIdentifier:" + userSigninIdentifier);

                //

                if ($scope.facebookRef.$getRecord(userSigninIdentifier) == null) {
                    console.warn("new user, registering...");
                    $scope.register(authProvider, authData);
                } else {
                    $scope.profileID = $scope.facebookRef.$getRecord(userSigninIdentifier).profileID;
                    $firebase(ref.child("users").child("signin").child("facebook").child(userSigninIdentifier)).$update({
                        token: authData.token,
                        expires: authData.expires,
                        AccessToken: authData.facebook.accessToken
                    });
                    $firebase(ref.child("users").child("data").child($scope.profileID)).$update({
                        displayName: authData.facebook.displayName,
                        email: authData.facebook.email,
                        picture: authData.facebook.cachedUserProfile.picture.data.url
                    });
                    console.log("Logged in as:", authData.uid);

                    var profileData = $scope.dataRef.$getRecord($scope.profileID);
                    //speichere nutzerdaten im objekt "user"
                    //für den zugriff auf die nutzerdaten, einfach user in den controller als dependency injecten,
                    //in eine lokale scope-variable überführen aka. $scope.userData = user; und dann spaß haben
                    user.profileID = profileData.profileID,
                        user.displayName = profileData.displayName,
                        user.email = profileData.email,
                        user.picture = profileData.picture,
                        user.birthdate = profileData.birthdate,
                        user.age = profileData.age,
                        user.hobby = profileData.hobby,
                        user.gender = profileData.gender,
                        user.firstname = profileData.firstname,
                        user.lastname = profileData.lastname
                    console.log(user);

                    $state.go('app.home');
                }
            }).catch(function(error) {
                console.error("Authentication failed facebook:", error);
            });

        }
    };

    $scope.register = function(authProvider, authData) {

        var newProfileID = Math.floor(Math.random() * (9999999999 - 1000000000 + 1) + 1000000000);

        while ($scope.dataRef.$getRecord(newProfileID) != null) {
            newProfileID = Math.floor(Math.random() * (9999999999 - 1000000000 + 1) + 1000000000);
        }

        if (authProvider == "google") {
            //write authentification data into database
            $firebase(ref.child("users").child("signin").child("google").child(authData.google.id)).$set({
                displayName: authData.google.displayName,
                token: authData.token,
                expires: authData.expires,
                uid: authData.uid,
                ID: authData.google.id,
                AccessToken: authData.google.accessToken,
                profileID: newProfileID
            });
            $firebase(ref.child("users").child("data").child(newProfileID)).$set({
                profileID: newProfileID,
                googleID: authData.google.id,
                displayName: authData.google.displayName,
                email: authData.google.email,
                picture: authData.google.cachedUserProfile.picture,
                gender: authData.google.cachedUserProfile.gender,
                firstname: authData.google.cachedUserProfile.given_name,
                lastname: authData.google.cachedUserProfile.family_name
            });
        }
        if (authProvider == "facebook") {
            //write authentification data into database
            $firebase(ref.child("users").child("signin").child("facebook").child(authData.facebook.id)).$set({
                displayName: authData.facebook.displayName,
                token: authData.token,
                expires: authData.expires,
                uid: authData.uid,
                ID: authData.facebook.id,
                AccessToken: authData.facebook.accessToken,
                profileID: newProfileID
            });
            $firebase(ref.child("users").child("data").child(newProfileID)).$set({
                profileID: newProfileID,
                googleID: null,
                facebookID: authData.facebook.id,
                displayName: authData.facebook.displayName,
                email: authData.facebook.email,
                picture: authData.facebook.cachedUserProfile.picture.data.url,
                gender: authData.facebook.cachedUserProfile.gender,
                firstname: authData.facebook.cachedUserProfile.first_name,
                lastname: authData.facebook.cachedUserProfile.last_name
            });
        }
        $state.go('app.home');
    }; //function register(authProvider)


    $ionicModal.fromTemplateUrl('templates/tos.html', {
        scope: $scope
    }).then(function(modalTos) {
        $scope.modalTos = modalTos;
    });

    // Triggered in the login modalTos to close it
    $scope.closeTos = function() {
        $scope.modalTos.hide();
    };

    // Open the login modalTos
    $scope.tos = function() {
        $scope.modalTos.show();
    };

    $ionicModal.fromTemplateUrl('templates/privacy.html', {
        scope: $scope
    }).then(function(modalPriv) {
        $scope.modalPriv = modalPriv;
    });

    // Triggered in the login modalPriv to close it
    $scope.closePriv = function() {
        $scope.modalPriv.hide();
    };

    // Open the login modalPriv
    $scope.privacy = function() {
        $scope.modalPriv.show();
    };
})


.controller('AppCtrl', function($scope, $ionicModal, $timeout) {

})

.controller('ProfileCtrl', function($scope, $firebase, Auth, user, UserInfo) {

    $scope.userData = user;

    $scope.getUserInfo = UserInfo.getProfile("2225696150");


})

.controller("SampleCtrl", ["$scope", "Auth",
    function($scope, Auth) {
        $scope.auth = Auth;
        $scope.user = $scope.auth.$getAuth();
        /* auth.$authWithOAuthPopup("facebook").then(function(authData) {
           console.log("Logged in as:", authData.uid);
         }).catch(function(error) {
           console.error("Authentication failed: ", error);
         });*/
    }
    ])

.controller('PlaylistsCtrl', function($scope, User) {

    $scope.userData = User;
    console.log($scope.userData);
    $scope.playlists = [{
        title: 'Reggae',
        id: 1
    }, {
        title: 'Chill',
        id: 2
    }, {
        title: 'Dubstep',
        id: 3
    }, {
        title: 'Indie',
        id: 4
    }, {
        title: 'Rap',
        id: 5
    }, {
        title: 'Cowbell',
        id: 6
    }];
    })

.controller('PlaylistCtrl', function($scope, $stateParams) {

    })

.controller('homeCtrl', function($scope, $ionicLoading, $cordovaGeolocation, $ionicPopover, $state) {


        $scope.positions = [{
            lat: 43.07493,
            lng: -89.381388
        }];

        $scope.$on('mapInitialized', function(event, map) {
            $scope.map = map;
            $cordovaGeolocation
                .getCurrentPosition()
                .then(function(position) {
                    var pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                    $scope.positions.lat = pos.k;
                    $scope.positions.lng = pos.B;
                    $scope.map.setCenter(pos);

                }, function(err) {
                    alert("error locating the user");
                });
        });

        $ionicPopover.fromTemplateUrl('templates/popovers/hugSettings.html', {
            scope: $scope,
        }).then(function(popover) {
            $scope.popover = popover;
        });
        $scope.openPopover = function($event) {
            $scope.popover.show($event);
        };
        $scope.closePopover = function() {
            $scope.popover.hide();
        };
        //Cleanup the popover when we're done with it!
        $scope.$on('$destroy', function() {
            $scope.popover.remove();
        });
        // Execute action on hide popover
        $scope.$on('popover.hidden', function() {
            // Execute action
        });
        // Execute action on remove popover
        $scope.$on('popover.removed', function() {
            // Execute action
        });

        $scope.displayResults = function() {
            $state.go('app.results');
        }
    })

.controller('resultCtrl', function($scope) {
        $scope.results = [];
        for (var i = 0; i < 5; i++) {
            $scope.results[i] = {
                name: i + 1,
                items: []
            };
            for (var j = 0; j < 3; j++) {
                $scope.results[i].items.push(i + '-' + j);
            }
        }
        console.log($scope.groups);

        /*
         * if given group is the selected group, deselect it
         * else, select the given group
         */
        $scope.toggleGroup = function(group) {
            if ($scope.isGroupShown(group)) {
                $scope.shownGroup = null;
            } else {
                $scope.shownGroup = group;
            }
        };
        $scope.isGroupShown = function(group) {
            return $scope.shownGroup === group;
        };
    });
