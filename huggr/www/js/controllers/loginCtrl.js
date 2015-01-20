.controller('loginCtrl', function($scope, $firebase, $ionicModal, Auth, $state, localstorage, $ionicViewService, $ionicPopover, $http, helper) {

    var ref = new Firebase("https://huggr.firebaseio.com/");
    var sync = $firebase(ref).$asObject();
    $scope.auth = Auth;


    //create child for data
    $scope.dataRef = $firebase(ref.child("users").child("data")).$asArray();

    //create child for google
    $scope.googleRef = $firebase(ref.child("users").child("signin").child("google")).$asArray();
    $scope.facebookRef = $firebase(ref.child("users").child("signin").child("facebook")).$asArray();
    $ionicViewService.nextViewOptions({
        disableBack: true
    });

    $scope.login = function(authProvider) {
        if (authProvider == "google") {

            ref.authWithOAuthPopup("google", function(err, authData) {
                if (authData) {


                    var userSigninIdentifier = authData.google.id;
                    if ($scope.googleRef.$getRecord(userSigninIdentifier) == null) {
                        console.warn("new user, registering...");
                        $scope.showPopUp(authProvider, authData);
                        //$scope.register(authProvider, authData);
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
                            picture: authData.google.cachedUserProfile.picture,
                            lastSeenTime: Firebase.ServerValue.TIMESTAMP
                        });
                        console.log("Logged in as:" + authData.uid);
                        var profileData = $scope.dataRef.$getRecord($scope.profileID);
                        //Store profile Data persistently in local storage for global usage
                        localstorage.setObject("userData", profileData);
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

            ref.authWithOAuthPopup("facebook", function(err, authData) {

                if (authData) {
                    var userSigninIdentifier = authData.facebook.id;
                    console.log("userSigninIdentifier:" + userSigninIdentifier);

                    //

                    if ($scope.facebookRef.$getRecord(userSigninIdentifier) == null) {
                        console.warn("new user, registering...");
                        $scope.showPopUp(authProvider, authData);
                    } else {
                        $scope.profileID = $scope.facebookRef.$getRecord(userSigninIdentifier).profileID;

                        var pictureData = $http.get("https://graph.facebook.com/" + authData.facebook.id + "/picture?type=large&redirect=0&width=400");
                        var FbProfilePicture;
                        pictureData.then(function(result) {
                            FbProfilePicture = result.data.data.url;
                            $firebase(ref.child("users").child("signin").child("facebook").child(userSigninIdentifier)).$update({
                                token: authData.token,
                                expires: authData.expires,
                                AccessToken: authData.facebook.accessToken
                            });
                            $firebase(ref.child("users").child("data").child($scope.profileID)).$update({
                                displayName: authData.facebook.displayName,
                                email: authData.facebook.email,
                                picture: FbProfilePicture,
                                lastSeenTime: Firebase.ServerValue.TIMESTAMP
                            });
                            console.log("Logged in as:", authData.uid);

                            var profileData = $scope.dataRef.$getRecord($scope.profileID);
                            //Store profile Data persistently in local storage for global usage
                            localstorage.setObject("userData", profileData);
                            $state.go('app.home');
                        }); //end pictureData
                    }
                }
                if (err) {
                    console.log("error")
                }
            }, {
                scope: "email"
            });

        }
    };

    $scope.loginModel = {}
    var popupAuthProvider;
    var popupAuthData;

    $scope.showPopUp = function(authProvider, authData) {
        $scope.popover.show(angular.element(document.getElementById('fb')));
        popupAuthProvider = authProvider;
        popupAuthData = authData;
    }

    $scope.toRegister = function() {
        if ($scope.loginModel.gender != null && $scope.loginModel.birthdate != null) {
            $scope.popover.hide();
            $scope.register(popupAuthProvider, popupAuthData);
        }
    }

    $ionicPopover.fromTemplateUrl('templates/popovers/addUserInfo.html', {
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
            }).then(function(x) {
                $firebase(ref.child("users").child("data").child(newProfileID)).$set({
                    profileID: newProfileID,
                    googleID: authData.google.id,
                    displayName: authData.google.displayName,
                    email: authData.google.email,
                    picture: authData.google.cachedUserProfile.picture,
                    gender: $scope.loginModel.gender,
                    birthdate: $scope.loginModel.birthdate.getTime(),
                    firstname: authData.google.cachedUserProfile.given_name,
                    lastname: authData.google.cachedUserProfile.family_name,
                    rating: 0,
                    numberHuggs: 0,
                    age: helper.calcAge($scope.loginModel.birthdate),
                    registerTime: Firebase.ServerValue.TIMESTAMP,
                    lastSeenTime: Firebase.ServerValue.TIMESTAMP
                }).then(function(data) {

                    //initialize user object with blocked array
                    $firebase(ref.child("users").child("data").child(newProfileID).child("blocked").child(1000000000001)).$set({
                        0: 1000000000001
                    }).then(function(y) {
                        $scope.dataRef = $firebase(ref.child("users").child("data")).$asArray();
                        $scope.dataRef.$loaded().then(function(data) {
                            //load data into local storage
                            var profileData = data.$getRecord(newProfileID);
                            //Store profile Data persistently in local storage for global usage
                            console.log("Successfully registered user!");
                            localstorage.setObject("userData", profileData);
                            $state.go('app.home');
                        }); //end loaded
                    }); //end set
                }); //end set userDB
            }); //end set signinDB
        }
        if (authProvider == "facebook") {
            var pictureData = $http.get("https://graph.facebook.com/" + authData.facebook.id + "/picture?type=large&redirect=0&width=400");
            var FbProfilePicture;
            pictureData.then(function(result) {
                FbProfilePicture = result.data.data.url;
                //write authentification data into database
                $firebase(ref.child("users").child("signin").child("facebook").child(authData.facebook.id)).$set({
                    displayName: authData.facebook.displayName,
                    token: authData.token,
                    expires: authData.expires,
                    uid: authData.uid,
                    ID: authData.facebook.id,
                    AccessToken: authData.facebook.accessToken,
                    profileID: newProfileID
                }).then(function(y) {
                    $firebase(ref.child("users").child("data").child(newProfileID)).$set({
                        profileID: newProfileID,
                        googleID: null,
                        facebookID: authData.facebook.id,
                        displayName: authData.facebook.displayName,
                        email: authData.facebook.email,
                        picture: FbProfilePicture,
                        gender: $scope.loginModel.gender,
                        birthdate: $scope.loginModel.birthdate.getTime(),
                        firstname: authData.facebook.cachedUserProfile.first_name,
                        lastname: authData.facebook.cachedUserProfile.last_name,
                        rating: 0,
                        numberHuggs: 0,
                        age: helper.calcAge($scope.loginModel.birthdate),
                        registerTime: Firebase.ServerValue.TIMESTAMP,
                        lastSeenTime: Firebase.ServerValue.TIMESTAMP
                    }).then(function(data) {

                        $firebase(ref.child("users").child("data").child(newProfileID).child("blocked").child(1000000000001)).$set({
                            0: 1000000000001
                        }).then(function(y) {

                            //initialize user object with blocked array
                            $scope.dataRef = $firebase(ref.child("users").child("data")).$asArray();
                            $scope.dataRef.$loaded().then(function(data) {
                                //load data into local storage
                                var profileData = data.$getRecord(newProfileID);
                                //Store profile Data persistently in local storage for global usage
                                console.log("Successfully registered");
                                localstorage.setObject("userData", profileData);
                                $state.go('app.home');
                            }); //end load data
                        }); //end set blocked
                    }); //end set usersData
                }); //end set signinData
            });

        }

        //wait till transaction is complete!

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

    $scope.goHome = function() {
        $state.go('app.home');
    }
})