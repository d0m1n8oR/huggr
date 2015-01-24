.controller('loginCtrl', function($scope, $firebase, $ionicModal, Auth, $state, localstorage, $ionicHistory, $ionicPopover, $http, helper, toast, $q) {

    var ref = new Firebase("https://huggr.firebaseio.com/");
    $scope.auth = Auth;

    function authDataCallback(authData) {
        if (authData) {
            if (authData.provider == 'google') {
                var userSigninIdentifier = authData.google.id;
                //create child for google
                $scope.googleRef = $firebase(ref.child("users").child("signin").child("google").orderByKey().equalTo(userSigninIdentifier.toString())).$asArray();

                //function to handle asynchronous call to DB
                function load() {
                    var def = $q.defer();
                    $scope.googleRef.$loaded().then(function(data) {
                        def.resolve(data.$getRecord(userSigninIdentifier));
                    })
                    return def.promise;
                }; //end function

                load().then(function(data) {
                    //check whether user is already registered (if not, value is null as it is not present in DB)
                    if (data == null) {
                        //show popup to gather additional user info for registering
                        $scope.showPopUp(authProvider, authData);
                    } else {
                        $scope.profileID = data.profileID;

                        //update auth data in DB
                        $firebase(ref.child("users").child("signin").child("google").child(userSigninIdentifier)).$update({
                            token: authData.token,
                            expires: authData.expires,
                            AccessToken: authData.google.accessToken
                        });

                        //update database with lastseen value
                        $firebase(ref.child("users").child("data").child($scope.profileID)).$update({
                            lastSeenTime: Firebase.ServerValue.TIMESTAMP
                        });

                        $scope.dataRef = $firebase(ref.child("users").child("data").orderByKey().equalTo($scope.profileID.toString())).$asArray();

                        //function to handle asynchronous call to DB
                        function load() {
                            var def = $q.defer();
                            $scope.dataRef.$loaded().then(function(data) {
                                def.resolve(data.$getRecord($scope.profileID));
                            });
                            return def.promise;
                        } //end function load

                        //load user info
                        load().then(function(profileData) {
                            localstorage.setObject("userData", profileData);
                            $state.go('app.home')
                        }); //end load()
                    } //end if
                }); //end load()     
            }
            if (authData.provider == 'facebook') {
                
                var userSigninIdentifier = authData.facebook.id;
                //create child for google
                $scope.facebookRef = $firebase(ref.child("users").child("signin").child("facebook").orderByKey().equalTo(userSigninIdentifier.toString())).$asArray();

                //function to handle asynchronous call to DB
                function load() {
                    var def = $q.defer();
                    $scope.facebookRef.$loaded().then(function(data) {
                        def.resolve(data.$getRecord(userSigninIdentifier));
                    });
                    return def.promise;
                }; //end function

                load().then(function(data) {
                    //check whether user is already registered (if not, value is null as it is not present in DB)
                    if (data == null) {
                        //show popup to gather additional user info for registering
                        $scope.showPopUp(authProvider, authData);
                    } else {
                        $scope.profileID = data.profileID;
                        //update signin information
                        $firebase(ref.child("users").child("signin").child("facebook").child(userSigninIdentifier)).$update({
                            token: authData.token,
                            expires: authData.expires,
                            AccessToken: authData.facebook.accessToken
                        });

                        //update last seen value
                        $firebase(ref.child("users").child("data").child($scope.profileID)).$update({
                            lastSeenTime: Firebase.ServerValue.TIMESTAMP
                        });
                        $scope.dataRef = $firebase(ref.child("users").child("data").orderByKey().equalTo($scope.profileID.toString())).$asArray();
                        //function to handle asynchronous call to DB
                        function load() {
                            var def = $q.defer();
                            $scope.dataRef.$loaded().then(function(data) {
                                def.resolve(data.$getRecord($scope.profileID));
                            })
                            return def.promise;
                        } //end function load

                        //loas user info
                        load().then(function(profileData) {
                            localstorage.setObject("userData", profileData);
                            $state.go('app.home')
                        }); //end load()
                    } //end if
                }); //end load()
            }
        } else {}
    }
    // Register the callback to be fired every time auth state changes
    ref.onAuth(authDataCallback);


    //create child for data
    $scope.dataRef; // = $firebase(ref.child("users").child("data")).$asArray();

    //create child for google
    $scope.googleRef; // = $firebase(ref.child("users").child("signin").child("google")).$asArray();
    $scope.facebookRef; // = $firebase(ref.child("users").child("signin").child("facebook")).$asArray();
    $ionicHistory.nextViewOptions({
        disableBack: true
    });

    $scope.login = function(authProvider) {
        if (authProvider == "google") {

            ref.authWithOAuthPopup("google", function(err, authData) {
                if (authData) {

                    var userSigninIdentifier = authData.google.id;

                    //create child for data


                    //create child for google
                    $scope.googleRef = $firebase(ref.child("users").child("signin").child("google").orderByKey().equalTo(userSigninIdentifier.toString())).$asArray();

                    //function to handle asynchronous call to DB
                    function load() {
                        var def = $q.defer();
                        $scope.googleRef.$loaded().then(function(data) {
                            def.resolve(data.$getRecord(userSigninIdentifier));
                        })

                        return def.promise;
                    }; //end function


                    load().then(function(data) {
                        //check whether user is already registered (if not, value is null as it is not present in DB)
                        if (data == null) {
                            //show popup to gather additional user info for registering
                            $scope.showPopUp(authProvider, authData);
                        } else {
                            $scope.profileID = data.profileID;

                            //update auth data in DB
                            $firebase(ref.child("users").child("signin").child("google").child(userSigninIdentifier)).$update({
                                token: authData.token,
                                expires: authData.expires,
                                AccessToken: authData.google.accessToken
                            });

                            //update database with lastseen value
                            $firebase(ref.child("users").child("data").child($scope.profileID)).$update({
                                lastSeenTime: Firebase.ServerValue.TIMESTAMP
                            });

                            //toast for user feedback
                            toast.pop("Welcome back!");

                            $scope.dataRef = $firebase(ref.child("users").child("data").orderByKey().equalTo($scope.profileID.toString())).$asArray();

                            //function to handle asynchronous call to DB
                            function load() {
                                var def = $q.defer();
                                $scope.dataRef.$loaded().then(function(data) {
                                    def.resolve(data.$getRecord($scope.profileID));
                                });
                                return def.promise;
                            } //end function load

                            //load user info
                            load().then(function(profileData) {
                                localstorage.setObject("userData", profileData);
                                $state.go('app.home')
                            }); //end load()
                        } //end if
                    }); //end load()

                } //end if 
                if (err) {
                    console.log("error");
                }
            }, {
                //define scope for access of user profile
                scope: "email"
            });

        }
        if (authProvider == "facebook") {

            ref.authWithOAuthPopup("facebook", function(err, authData) {

                if (authData) {
                    var userSigninIdentifier = authData.facebook.id;
                    //create child for data

                    //create child for google
                    $scope.facebookRef = $firebase(ref.child("users").child("signin").child("facebook").orderByKey().equalTo(userSigninIdentifier.toString())).$asArray();

                    //function to handle asynchronous call to DB
                    function load() {
                        var def = $q.defer();
                        $scope.facebookRef.$loaded().then(function(data) {
                            def.resolve(data.$getRecord(userSigninIdentifier));
                        });
                        return def.promise;
                    }; //end function

                    load().then(function(data) {
                        //check whether user is already registered (if not, value is null as it is not present in DB)
                        if (data == null) {
                            //show popup to gather additional user info for registering
                            $scope.showPopUp(authProvider, authData);
                        } else {
                            $scope.profileID = data.profileID;
                            //update signin information
                            $firebase(ref.child("users").child("signin").child("facebook").child(userSigninIdentifier)).$update({
                                token: authData.token,
                                expires: authData.expires,
                                AccessToken: authData.facebook.accessToken
                            });

                            //update last seen value
                            $firebase(ref.child("users").child("data").child($scope.profileID)).$update({
                                lastSeenTime: Firebase.ServerValue.TIMESTAMP
                            });
                            //Uer feedback
                            toast.pop("Welcome back!");

                            $scope.dataRef = $firebase(ref.child("users").child("data").orderByKey().equalTo($scope.profileID.toString())).$asArray();
                            //function to handle asynchronous call to DB
                            function load() {
                                var def = $q.defer();
                                $scope.dataRef.$loaded().then(function(data) {
                                    def.resolve(data.$getRecord($scope.profileID));
                                })
                                return def.promise;
                            } //end function load

                            //loas user info
                            load().then(function(profileData) {
                                localstorage.setObject("userData", profileData);
                                $state.go('app.home')
                            }); //end load()
                        } //end if
                    }); //end load()
                } //end if
                if (err) {
                    console.log("error")
                }
            }, {
                //set scope
                scope: "email"
            }); //end auth
        } //end if facebook
    }; //end function

    //intialize model for popup valus
    $scope.loginModel = {}
    var popupAuthProvider;
    var popupAuthData;

    //shows popup where users can enter data
    $scope.showPopUp = function(authProvider, authData) {
        //displays popup
        $scope.popover.show(angular.element(document.getElementById('huggrText')));
        popupAuthProvider = authProvider;
        popupAuthData = authData;
    }

    //checks whether set values are not null
    $scope.toRegister = function() {
        if ($scope.loginModel.gender != null && $scope.loginModel.birthdate != null) {
            $scope.popover.hide();
            $scope.register(popupAuthProvider, popupAuthData);
        } else {
            //feedback
            toast.pop("Please enter info");
        }
    }

    //stuff for the popover
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

    //function to register the user
    $scope.register = function(authProvider, authData) {

        //create new random profileID
        var newProfileID = Math.floor(Math.random() * (9999999999 - 1000000000 + 1) + 1000000000);

        //check whether profileID alreadyexists in DB
        while ($firebase(ref.child("users").child("data").orderByKey().equalTo(newProfileID.toString())).$asArray().$getRecord(newProfileID) != null) {
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
                //write user info data to database
                $firebase(ref.child("users").child("data").child(newProfileID)).$set({
                    profileID: newProfileID,
                    googleID: authData.google.id,
                    displayName: authData.google.displayName,
                    email: authData.google.email,
                    picture: authData.google.cachedUserProfile.picture,
                    gender: $scope.loginModel.gender,
                    birthdate: $scope.loginModel.birthdate.getTime(),
                    firstName: authData.google.cachedUserProfile.given_name,
                    lastname: authData.google.cachedUserProfile.family_name,
                    rating: 0,
                    numberHuggs: 0,
                    age: helper.calcAge($scope.loginModel.birthdate),
                    registerTime: Firebase.ServerValue.TIMESTAMP,
                    lastSeenTime: Firebase.ServerValue.TIMESTAMP,
                    blocked: {
                        1000000000001: {
                            0: 1000000000001
                        }
                    }
                }).then(function(y) {

                    //load new generated profile
                    var newProfileIDString = newProfileID.toString();
                    $scope.dataRef = $firebase(ref.child("users").child("data").orderByKey().equalTo(newProfileIDString)).$asArray();
                    $scope.dataRef.$loaded().then(function(data) {
                        //load data into local storage
                        var profileData = data.$getRecord(newProfileID);
                        //Store profile Data persistently in local storage for global usage
                        toast.pop("Welcome to the huggr community!");
                        localstorage.setObject("userData", profileData);
                        $state.go('app.home');
                    }); //end loaded
                }); //end set
            }); //end set signinDB
        }
        if (authProvider == "facebook") {
            //as facebook only returns a 100x100 picture in the auth object we need to get it from facebook's Graph API
            //see https://developers.facebook.com/docs/graph-api/reference/user/picture
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
                    //write user info data to database
                    $firebase(ref.child("users").child("data").child(newProfileID)).$set({
                        profileID: newProfileID,
                        googleID: null,
                        facebookID: authData.facebook.id,
                        displayName: authData.facebook.displayName,
                        email: authData.facebook.email,
                        picture: FbProfilePicture,
                        gender: $scope.loginModel.gender,
                        birthdate: $scope.loginModel.birthdate.getTime(),
                        firstName: authData.facebook.cachedUserProfile.first_name,
                        lastname: authData.facebook.cachedUserProfile.last_name,
                        rating: 0,
                        numberHuggs: 0,
                        age: helper.calcAge($scope.loginModel.birthdate),
                        registerTime: Firebase.ServerValue.TIMESTAMP,
                        lastSeenTime: Firebase.ServerValue.TIMESTAMP,
                        blocked: {
                            1000000000001: {
                                0: 1000000000001
                            }
                        }
                    }).then(function(y) {

                        //Load newly created profile
                        var newProfileIDString = newProfileID.toString();
                        $scope.dataRef = $firebase(ref.child("users").child("data").orderByKey().equalTo(newProfileIDString)).$asArray();
                        $scope.dataRef.$loaded().then(function(data) {
                            //load data into local storage
                            var profileData = data.$getRecord(newProfileID);
                            //Store profile Data persistently in local storage for global usage
                            console.log("Successfully registered");
                            toast.pop("Welcome to the huggr community!");
                            localstorage.setObject("userData", profileData);
                            $state.go('app.home');
                        }); //end load data
                    }); //end set blocked
                }); //end set signinData
            });

        }

        //wait till transaction is complete!

    }; //function register(authProvider)

    //load modals to show TOS ans Privacy
    $ionicModal.fromTemplateUrl('templates/modals/tos.html', {
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

    $ionicModal.fromTemplateUrl('templates/modals/privacy.html', {
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