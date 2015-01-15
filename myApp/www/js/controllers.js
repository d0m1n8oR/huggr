angular.module('starter.controllers', [])

.factory("Auth", ["$firebaseAuth",
    function($firebaseAuth) {
        var ref = new Firebase("https://huggr.firebaseio.com/");
        return $firebaseAuth(ref);
    }
])

//Factory um UserInfos abzurufen
//Usage: UserInfo in den Controller injecten, dann im Code: UserInfo.getProfile(ProfileID);
//Important: This is a synchronised method, so you have to use UserInfo.getProfile({profileID}).then(function(returnData){...})
.factory('UserInfo', ["$firebase", "$q",
    function($firebase, $q) {
        //initialize firebase
        var ref = new Firebase("https://huggr.firebaseio.com/users/data");
        var dataRef = $firebase(ref).$asArray();

        //$q for synchronous method call
        var deferred = $q.defer();

        return {
            getProfile: function(ID) {
                console.log(ID);
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
                            "lastname": record.lastname,
                            "numberHuggs": record.numberHuggs,
                            "rating": record.rating
                        };
                        //console.log(profileData);
                        deferred.resolve(profileData);
                        //return profileData;

                    }) // end then

                .catch(function(error) {
                    console.error("Error getting UserInfo:", error);
                    deferred.reject("Error getting UserInfo: " + error)
                }); // end catch

                return deferred.promise;
            } // end function(ID)
        };
    } // end function
]) //end factory

.factory('helper', [

    function() {
        return {
            calcAge: function(date) {
                var ageDifMs = Date.now() - date.getTime();
                var ageDate = new Date(ageDifMs); // miliseconds from epoch
                return Math.abs(ageDate.getUTCFullYear() - 1970);
            }
        };
    }
])

.factory('localstorage', ['$window',
    function($window) {
        return {
            set: function(key, value) {
                $window.localStorage[key] = value;
            },
            get: function(key, defaultValue) {
                return $window.localStorage[key] || defaultValue;
            },
            setObject: function(key, value) {
                $window.localStorage[key] = JSON.stringify(value);
            },
            getObject: function(key) {
                return JSON.parse($window.localStorage[key] || '{}');
            }
        }
    }
])


.controller('loginCtrl', function($scope, $firebase, $ionicModal, Auth, $state, localstorage, $ionicViewService) {

    var ref = new Firebase("https://huggr.firebaseio.com/");
    var sync = $firebase(ref).$asObject();
    $scope.auth = Auth;
    $scope.check = $scope.auth.$getAuth();


    //create child for data
    $scope.dataRef = $firebase(ref.child("users").child("data")).$asArray();


    //create child for google
    $scope.googleRef = $firebase(ref.child("users").child("signin").child("google")).$asArray();
    $scope.facebookRef = $firebase(ref.child("users").child("signin").child("facebook")).$asArray();
    $ionicViewService.nextViewOptions({
        disableBack: true
    });

    //function for logout
    $scope.logout = function() {

        //disconnects user from auth object, needs to relogin
        $scope.auth.$unauth();

        //reloads window to show login fields
        window.location.reload();
    } // end function

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
                    //Store profile Data persistently in local storage for global usage
                    localstorage.setObject("userData", profileData);
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
                lastname: authData.google.cachedUserProfile.family_name,
                rating: 0,
                numberHuggs: 0
            }).then(function(data) {

                $scope.dataRef = $firebase(ref.child("users").child("data")).$asArray();
                $scope.dataRef.$loaded().then(function(data) {
                    //load data into local storage
                    var profileData = data.$getRecord(newProfileID);
                    //Store profile Data persistently in local storage for global usage
                    console.log(profileData);
                    localstorage.setObject("userData", profileData);
                    $state.go('app.home');
                });
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
                lastname: authData.facebook.cachedUserProfile.last_name,
                rating: 0,
                numberHuggs: 0
            }).then(function(data) {
                $scope.dataRef = $firebase(ref.child("users").child("data")).$asArray();
                $scope.dataRef.$loaded().then(function(data) {
                    //load data into local storage
                    var profileData = data.$getRecord(newProfileID);
                    //Store profile Data persistently in local storage for global usage
                    console.log(profileData);
                    localstorage.setObject("userData", profileData);
                    $state.go('app.home');
                });
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


.controller('AppCtrl', function($scope, $ionicModal, $timeout) {

})

//this controller is addressed when a link like this is opened: app/profile/{pofileid}/{huggid}
//These links are only used to show profiles of people for hugging whereas the "ProfileCtrl" is used to show the own profile
.controller('ExtProfileCtrl', function($scope, $firebase, Auth, UserInfo, helper, localstorage, $stateParams) {
    //stuff with stateParams
    //In the hugg results when clicking on a offered hugg the user is refered to this page
    //The params are the profileID of the user that offers the hugg and the huggID
    //The huggID is needed so that the answer to the hugg can be mapped on the right huggID

    $scope.huggID = $stateParams.huggID;
    $scope.data;
    $scope.currentUser = localstorage.getObject('userData');
    var ref = new Firebase("https://huggr.firebaseio.com/");
    $scope.huggRef = $firebase(ref.child("hugg")).$asArray();

    UserInfo.getProfile($stateParams.profileID).then(function(value) {
        $scope.data = value;

        var ref = new Firebase("https://huggr.firebaseio.com/users/data/" + $scope.data.profileID);
        var userObject = $firebase(ref).$asObject();

        //displays information
        userObject.$bindTo($scope, "data").then(function() {
            $scope.data.age = helper.calcAge(new Date($scope.data.birthdate));
        }); //end bindTo
    }); //end getProfile

    $scope.answerHugg = function answerHugg(huggID) {
        var date = new Date();
        var today = date.getTime();

        //adds info of user that accepts hugg to database
        $firebase(ref.child("hugg").child(huggID)).$update({
            answered: 1,
            answerProfileID: $scope.currentUser.profileID,
            answerTime: today,
            answerPicture: $scope.currentUser.picture,
            answerGender: $scope.currentUser.gender,
            answerFirstName: $scope.currentUser.firstname,
            answerRating: $scope.currentUser.rating

        }).then(function(data) {

            console.log("Successfully updated");

        }); //end then

    } //end function

}) //end controller

.controller('ProfileCtrl', function($scope, $firebase, Auth, UserInfo, helper, localstorage, $stateParams) {

    //initialize stuff
    $scope.currentUser = localstorage.getObject('userData');
    var ref = new Firebase("https://huggr.firebaseio.com/users/data/" + $scope.currentUser.profileID);
    var firebaseRef = new Firebase("https://huggr.firebaseio.com/");
    $scope.orderOwnHuggRef = $firebase(firebaseRef.child("hugg").orderByChild('reqProfileID').equalTo($scope.currentUser.profileID).limitToFirst(100)).$asArray();
    $scope.orderOtherHuggRef = $firebase(firebaseRef.child("hugg").orderByChild('answerProfileID').equalTo($scope.currentUser.profileID).limitToFirst(100)).$asArray();


    //show data in profile
    var userObject = $firebase(ref).$asObject();
    userObject.$bindTo($scope, "currentUser").then(function() {
        $scope.currentUser.age = helper.calcAge(new Date($scope.currentUser.birthdate));
        localstorage.setObject("userData", $scope.currentUser)
    }); // end bindTo

    //show unanswered huggs goes here + delete button
    var unansweredHuggs = {
        hugg: []
    };

    var answeredHuggs = {
        hugg: []
    };

    var unacceptedHuggs = {
        hugg: []
    };
    
    var ownAcceptedHuggs = {
        hugg: []
    };

    $scope.orderOwnHuggRef.$loaded().then(function(data) {

        var i = 0;
        while (data.$keyAt(i) != null) {

            var record = data.$getRecord(data.$keyAt(i));

            //unanswered huggs are also not accepted and not done
            if (record.answered == 0) {
                unansweredHuggs.hugg.push({
                    "huggID": record.huggID,
                    "lat": record.reqLat,
                    "long": record.reqLong,
                    "time": record.requestTime
                });
            } //endif

            //get huggs that the user requested, somebody else answered them but they are not yet done
            //corresponding button is acceptHugg() or declineHugg()
            if (record.answered == 1 && record.done == 0 && record.accepted == 0) {
                answeredHuggs.hugg.push({
                    "huggID": record.huggID,
                    "lat": record.reqLat,
                    "long": record.reqLong,
                    "time": record.requestTime,
                    "answerProfileID": record.answerProfileID,
                    "answerTime": record.answerTime,
                    "answerPicture": record.answerPicture,
                    "answerGender": record.answerGender,
                    "answerFirstName": record.answerFirstName
                });
            } //end if
            
            //get huggs that the user requested, somebody else answered them and the requesting user has already accepted the hugg
            //the hugg has not yet taken place
            //corresponding button is declineHugg()
            if (record.answered == 1 && record.done == 0 && record.accepted == 1) {
                ownAcceptedHuggs.hugg.push({
                    "huggID": record.huggID,
                    "lat": record.reqLat,
                    "long": record.reqLong,
                    "time": record.requestTime,
                    "answerProfileID": record.answerProfileID,
                    "answerTime": record.answerTime,
                    "answerPicture": record.answerPicture,
                    "answerGender": record.answerGender,
                    "answerFirstName": record.answerFirstName
                });
            } //end if

            i++;
        } //end while
    });

    $scope.orderOtherHuggRef.$loaded().then(function(data) {

        var i = 0;
        while (data.$keyAt(i) != null) {

            var record = data.$getRecord(data.$keyAt(i));

            //unanswered huggs are also not accepted and not done
            //corresponding button is revokeAnswer()
            if (record.answered == 1 && record.accepted == 0) {
                unacceptedHuggs.hugg.push({
                    "huggID": record.huggID,
                    "lat": record.reqLat,
                    "long": record.reqLong,
                    "time": record.requestTime,
                    "profileID": record.reqProfileID,
                    "picture": record.reqPicture,
                    "gender": record.reqGender,
                    "rating": record.reqRating,

                });
            } //endif

            i++;
        } //end while

        console.log("Profile of User")
        console.log("Huggs from you that nobody has yet answered:");
        for (i = 0; i < unansweredHuggs.hugg.length; i++) {
            console.log(i + " " + unansweredHuggs.hugg[i].huggID);
        }
        console.log("\nHuggs from you that someone else answered:");
        for (i = 0; i < answeredHuggs.hugg.length; i++) {
            console.log(i + " " + answeredHuggs.hugg[i].huggID);
        }
        console.log("\nHuggs that you answered but the other person has not yet accepted:");
        for (i = 0; i < unacceptedHuggs.hugg.length; i++) {
            console.log(i + " " + unacceptedHuggs.hugg[i].huggID);
        }
        console.log("\nHuggs that someone else answered and you accepted");
        for(i = 0; i<ownAcceptedHuggs.hugg.length;i++)
        {
            console.log(i+" "+ownAcceptedHuggs.hugg[i].huggID);
        }
    }); //end then

    //remove huggs that nobody has answered yet from unanswered huggs list
    $scope.removeHugg = function removeHugg(huggID) {
        $firebase(firebaseRef.child("hugg")).$remove(huggID).then(function(data) {

        }).then(function(data) {
            console.log("Successfully removed hugg");
            return 1;
        }); //end then
    }; //end function

    //accept a hugg answer to a request by this user
    $scope.acceptHugg = function acceptHugg(huggID) {
        $firebase(firebaseRef.child("hugg").child(huggID)).$update({
            accepted: 1
        }).then(function(data) {
            console.log("successfully accepted hugg!");
            return 1;
        }); //end then

    }; //end function

    //decline a hugg answer to a request that was made by this user
    $scope.declineHugg = function declineHugg(huggID, answerProfileID) {

        $firebase(firebaseRef.child("hugg").child(huggID)).$update({
            answered: 0,
            accepted: 0,
            answerProfileID: null,
            answerPicture: null,
            answerGender: null,
            answerTime: null,
            answerFirstName: null,
            answerRating: null
        }).then(function(x) {

            $firebase(firebaseRef.child("hugg").child(huggID).child("blocked").child(answerProfileID)).$set({
                1: answerProfileID
            }).then(function(y) {
                console.log("Successfully declined hugg");
                return 1;
            }); //end then

        }); //end then
    }; //end function

    //revoke an answer to a hugg (the hugg is requested from somebody else, the user answered the hugg, the hugg is not yet accepted)
    //the user doesn't want to participate in the offered hugg
    $scope.revokeAnswer = function revokeAnswer(huggID) {

        $firebase(firebaseRef.child("hugg").child(huggID)).$update({
            answered: 0,
            accepted: 0,
            answerProfileID: null,
            answerPicture: null,
            answerGender: null,
            answerTime: null,
            answerFirstName: null,
            answerRating: null
        }).then(function(x) {
            console.log("Successfully revoked hugg answer!");
            return 1;
        }); //end then

    }; //end function

    //show answered huggs + revoke button
    //show accepted huggs + decline button

    //show done huggs + rating button

    //show archived huggs
})

.controller("SampleCtrl", ["$scope", "$firebase", "Auth", "$stateParams",
    function($scope, Auth, $firebase, $stateParams) {
        //$scope.auth = Auth;
        //$scope.user = $scope.auth.$getAuth();
        console.log($stateParams);

    }
])

.controller('SettingsCtrl', function($scope, localstorage, $firebase, $cordovaCamera) {
    //Initial holen wir die Nutzerdaten aus dem Localstorage, damit wir mit der ProfileID arbeiten können.
    $scope.userData = localstorage.getObject('userData');

    var ref = new Firebase("https://huggr.firebaseio.com/users/data/" + $scope.userData.profileID);
    var userObject = $firebase(ref).$asObject();
    //Katsching! Three-Way-Databinding 4tw! <3 AngularFire
    userObject.$bindTo($scope, "userData").then(localstorage.setObject("userData", $scope.userData));
    //Todo: den tatsächlichen Connect zu dem jeweils anderen dienst
    var returnval = 0;
    if ($scope.userData.googleID != null) {
        returnval = returnval + 10;
    }
    if ($scope.userData.facebookID != null) {
        returnval = returnval + 1;
    }
    $scope.gProvider = false;
    $scope.fbProvider = false;
    if (returnval == 0) {
        console.warn("Keine Services");
    }
    if (returnval == 1) {
        $scope.gProvider = true;
    }
    if (returnval == 10) {
        $scope.fbProvider = true;
    }
    if (returnval == 11) {
        $scope.fbProvider = false;
        $scope.gProvider = false;
    }

    var connectRef = new Firebase("https://huggr.firebaseio.com/users/");
    $scope.googleRef = $firebase(connectRef.child("signin").child("google")).$asArray();
    $scope.facebookRef = $firebase(connectRef.child("signin").child("facebook")).$asArray();

    var mainref = new Firebase("https://huggr.firebaseio.com/");

    $scope.connect = function connect(provider) {
        if (provider == "toGoogle") {
            connectRef.authWithOAuthPopup("google", function(err, user) {
                if (err) {
                    console.log(err);
                }
                if (user) {
                    connectRef.onAuth(function(authData) {
                        $firebase(mainref.child("users").child("signin").child("google").child(authData.google.id)).$set({
                            displayName: authData.google.displayName,
                            token: authData.token,
                            expires: authData.expires,
                            uid: authData.uid,
                            ID: authData.google.id,
                            AccessToken: authData.google.accessToken,
                            profileID: $scope.userData.profileID
                        });
                        $firebase(ref).$update({
                            googleID: authData.google.id
                        });
                    });

                }
            });
        }
        if (provider == "toFacebook") {
            connectRef.authWithOAuthPopup("facebook", function(err, user) {
                if (err) {
                    console.log(err);
                }
                if (user) {
                    connectRef.onAuth(function(authData) {
                        $firebase(mainref.child("users").child("signin").child("facebook").child(authData.facebook.id)).$set({
                            displayName: authData.facebook.displayName,
                            token: authData.token,
                            expires: authData.expires,
                            uid: authData.uid,
                            ID: authData.facebook.id,
                            AccessToken: authData.facebook.accessToken,
                            profileID: $scope.userData.profileID
                        });
                        $firebase(ref).$update({
                            facebookID: authData.facebook.id
                        });
                    });
                }
            });
        }
    }

    document.addEventListener("deviceready", function() {

        var options = {
            quality: 50,
            destinationType: Camera.DestinationType.DATA_URL,
            sourceType: Camera.PictureSourceType.CAMERA,
            allowEdit: true,
            encodingType: Camera.EncodingType.JPEG,
            targetWidth: 100,
            targetHeight: 100,
            popoverOptions: CameraPopoverOptions,
            saveToPhotoAlbum: false
        };
        $scope.takeNewPicture = function() {
            $cordovaCamera.getPicture(options).then(function(imageData) {
                $scope.userData.picture = "data:image/jpeg;base64," + imageData;
            }, function(err) {
                // error
            });
        };


    }, false);

})


.controller('PlaylistCtrl', function($scope, $stateParams) {

})

.controller('homeCtrl', function($scope, $ionicLoading, $cordovaGeolocation, $ionicPopover, $state, localstorage) {
    //Setze Koordinaten für Initialisierung von Maps
    $scope.positions = {
        lat: 49.4677562,
        lng: 8.506636
    };

    $scope.$on('mapInitialized', function(event, map) {
        $scope.map = map;
        //hole die GPS/IP-Geolocation
        $cordovaGeolocation
            .getCurrentPosition()
            .then(function(position) {
                //wandle in google Maps format um
                var pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                $scope.positions.lat = pos.k;
                $scope.positions.lng = pos.D;
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

    //create huggRequest Object to store values from filters popup
    $scope.huggRequest = {
        male: "none",
        female: "none",
        range: "10 km"
    }

    $scope.displayResults = function() {

        var male = $scope.huggRequest.male;
        var female = $scope.huggRequest.female;
        var range = $scope.huggRequest.range;
        //reset huggRequest Object values
        $scope.huggRequest.male = "none";
        $scope.huggRequest.female = "none";
        $scope.huggRequest.range = "none";

        //this opens the results view with the parameters
        $state.go('app.results', {
            male: male,
            female: female,
            range: range
        });
    };
})

.controller('resultCtrl', function($scope, Auth, $firebase, $stateParams, localstorage, $cordovaGeolocation, $q) {

    //initialize all the stuff
    $scope.auth = Auth;
    $scope.user = $scope.auth.$getAuth();
    var ref = new Firebase("https://huggr.firebaseio.com/");
    var sync = $firebase(ref).$asObject();
    $scope.huggRef = $firebase(ref.child("hugg")).$asArray();
    $scope.currentUser = localstorage.getObject('userData');
    //displays all huggs that suit the request
    //if huggs are not answered, they are also not done or accepted
    $scope.orderHuggRef = $firebase(ref.child("hugg").orderByChild('answered').equalTo(0).limitToFirst(100)).$asArray();

    var gender;
    var range;

    //checks what gender is filtered on
    if ($stateParams.female == "none" && $stateParams.male == "true") {
        gender = "male";
    }
    if ($stateParams.male == "none" && $stateParams.female == "true") {
        gender = "female";
    }
    if (($stateParams.male == "none" && $stateParams.female == "none") || ($stateParams.male == "true" && $stateParams.female == "true")) {
        gender = "both";
    }

    //chek for range values
    if ($stateParams.range == "5 km") {
        range = 5;
    }
    if ($stateParams.range == "10 km") {
        range = 10;
    } else {
        range = 100;
    }

    //function to request a hugg in case the presented huggs are not suitable
    $scope.requestHugg = function requestHugg(reqLat, reqLong) {

        //create random huggID
        var huggID = Math.floor(Math.random() * (9999999999 - 1000000000 + 1) + 1000000000);

        $scope.huggRef.$loaded().then(function(data) {

            //check whether huggID already exists in db
            while (data.$getRecord(huggID) != null) {
                huggID = Math.floor(Math.random() * (9999999999 - 1000000000 + 1) + 1000000000);
            } //end while

            //time calulation
            var date = new Date();
            var today = date.getTime();

            //get GPS coordinates
            $cordovaGeolocation
                .getCurrentPosition()
                .then(function(position) {

                    //save data to firebase in new child with calculated huggID
                    $firebase(ref.child("hugg").child(huggID)).$set({
                        huggID: huggID,
                        reqLat: position.coords.latitude,
                        reqLong: position.coords.longitude,
                        FilterGender: gender,
                        done: 0,
                        answered: 0,
                        accepted: 0,
                        reqProfileID: $scope.currentUser.profileID,
                        reqGender: $scope.currentUser.gender,
                        requestTime: today,
                        reqFirstName: $scope.currentUser.firstname,
                        reqPicture: $scope.currentUser.picture,
                        reqRating: $scope.currentUser.rating

                    }).then(function(x) {

                        $firebase(ref.child("hugg").child(huggID).child("rating")).$set({
                            rateReqHugg: ".",
                            rateAnswerHugg: ".",
                            total: "."
                        }).then(function(y)
                                
                                {
                            console.log("Successfully requested hugg");
                            return 1;
                        }); //end then

                    }); //end then (rating)

                }); // end then (GPS)

        }); // end then (Loaded)

    }; // end function

    //initialize JSON
    var huggArray = {
        hugg: []
    }

    //start values
    var currentLat = 49.472726;
    var currentLong = 8.449496;

    //wait for ref to load before continuing
    function getHuggs() {
        var deferred = $q.defer();

        $scope.orderHuggRef.$loaded().then(function(data) {
            var i = 0;
            //get GPS locaion
            $cordovaGeolocation
                .getCurrentPosition()
                .then(function(position) {

                    //save coordinates to var
                    currentLat = position.coords.latitude;
                    curentLong = position.coords.longitude;

                    //parse all elements of returning array
                    while (data.$keyAt(i) != null) {

                        function load() {
                            var def = $q.defer();
                            def.resolve(data.$getRecord(data.$keyAt(i)));
                            return def.promise
                        }; //end function
                        //check whether filter gender of searching person and gender of requestor match
                        //check whether gender of searching person and filter of requestor match
                        //check whether current user's profile ID is among the blocked profile IDs
                        load().then(function(record) {
                            if (((gender == "both") || (gender != "both" && record.reqGender == gender)) && ((record.FilterGender == "both") || (record.FilterGender != "both" && record.FilterGender == $scope.currentUser.gender)) && (record.reqProfileID != $scope.currentUser.profileID)) {

                                $scope.huggRef = $firebase(ref.child("hugg").child(record.huggID).child("blocked")).$asArray();
                                $scope.huggRef.$loaded().then(function(data) {

                                    //check whether user is blocked in results                            
                                    if (data.$getRecord($scope.currentUser.profileID) == null) {

                                        //calc distance
                                        var radius = 6371;
                                        var diffLat = (currentLat - record.reqLat) * (Math.PI / 180);
                                        var diffLon = (currentLong - record.reqLong) * (Math.PI / 180);
                                        var a =
                                            Math.sin(diffLat / 2) * Math.sin(diffLat / 2) +
                                            Math.cos((record.reqLat) * (Math.PI / 180)) * Math.cos((currentLat) * (Math.PI / 180)) *
                                            Math.sin(diffLon / 2) * Math.sin(diffLon / 2);
                                        var b = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                                        var distance = radius * b;

                                        //check for distance within range and save to JSON
                                        if (distance <= range) {
                                            huggArray.hugg.push({
                                                "huggID": record.huggID,
                                                "firstName": record.reqFirstName,
                                                "gender": record.reqGender,
                                                "lat": record.reqLat,
                                                "long": record.reqLong,
                                                "time": record.requestTime,
                                                "picture": record.reqPicture,
                                                "profileID": record.reqProfileID,
                                                "distance": distance,
                                                "rating": record.reqRating
                                            }); //end push
                                        } // end if

                                    } //end if
                                }); //end then
                            } // end if
                        }); //end then
                        i++;
                    } //end while
                    deferred.resolve(huggArray);
                }); //end GPS then

            //This is the return value
        }); //end load huggRef
        return deferred.promise;
    } //end function

    getHuggs().then(function(array) {
        console.log(array);
    });

}); //end resultCTRL