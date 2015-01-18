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

.factory('toast', function($rootScope, $timeout, $ionicPopup, $ionicLoading) {
    return {
        show: function(message, duration, position) {
            message = message || "There was a problem...";
            duration = duration || 'short';
            position = position || 'top';


            if (duration == 'short') {
                duration = 2000;
            } else {
                duration = 5000;
            }

            var myPopup = $ionicPopup.show({
                template: "<div class='toast'>" + message + "</div>",
                scope: $rootScope,
                buttons: []
            });

            $timeout(function() {
                myPopup.close();
            }, duration);

        },
        pop: function(msg) {
            var myToast = $ionicLoading.show({
                template: msg,
                noBackdrop: false,
                duration: 2500
            });
        }
    }
})

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

.controller('logoutCtrl', function($scope, $firebase, Auth, $state, localstorage, $ionicViewService, $ionicPopover, $http, helper) {

    var ref = new Firebase("https://huggr.firebaseio.com/");
    var sync = $firebase(ref).$asObject();
    $scope.auth = Auth;
    $scope.check = $scope.auth.$getAuth();

    console.log("here");
    //function for logout
    $scope.logout = function() {

        //disconnects user from auth object, needs to relogin
        $scope.auth.$unauth();

        //reloads window to show login fields
        $state.go('app.homef');
    } // end function
})

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
                                picture: FbProfilePicture
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
                    age: helper.calcAge($scope.loginModel.birthdate)
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
                        age: helper.calcAge($scope.loginModel.birthdate)
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


.controller('AppCtrl', function($scope, $ionicModal, $timeout) {

})

//this controller is addressed when a link like this is opened: app/profile/{pofileid}/{huggid}
//These links are only used to show profiles of people for hugging whereas the "ProfileCtrl" is used to show the own profile
.controller('ExtProfileCtrl', function($scope, $firebase, Auth, UserInfo, helper, localstorage, $stateParams, $state, toast) {
    //stuff with stateParams
    //In the hugg results when clicking on a offered hugg the user is refered to this page
    //The params are the profileID of the user that offers the hugg and the huggID
    //The huggID is needed so that the answer to the hugg can be mapped on the right huggID
    $scope.$on("$ionicView.enter", function(scopes, states) {
        console.log("enter");
        console.log($scope);
        //

    });

    $scope.huggID = $stateParams.huggID;
    $scope.profileID = $stateParams.profileID;
    console.log($scope.huggID);
    $scope.data;
    $scope.currentUser = localstorage.getObject('userData');
    var ref = new Firebase("https://huggr.firebaseio.com/");
    $scope.huggRef = $firebase(ref.child("hugg")).$asArray();

    UserInfo.getProfile($scope.profileID).then(function(value) {
        $scope.data = value;

        var userObject = $firebase(ref.child("users").child("data").child($scope.data.profileID)).$asObject();

        //displays information
        userObject.$bindTo($scope, "data").then(function() {
            $scope.data.age = helper.calcAge(new Date($scope.data.birthdate));
        }); //end bindTo
    }); //end getProfile

    //block a user from ever sending requests again
    $scope.blockUser = function blockUser(blockProfileID) {

        $firebase(ref.child("users").child("data").child($scope.currentUser.profileID).child("blocked").child(blockProfileID)).$set({
            0: blockProfileID
        }).then(function(y) {
            toast.pop("You have successfully blocked this user");
            return 1;
        }); //end set

    }; //end function

    //answer to a hugg that the user of this currently shown profile has requested
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

            //add notification for user that requested the hugg
            $firebase(ref.child("users").child("data").child($scope.profileID).child("notifications").child(huggID)).$set({
                huggID: huggID,
                firstName: $scope.currentUser.firstname,
                picture: $scope.currentUser.picture,
                time: today,
                profileID: $scope.currentUser.profileID,
                type: "answer",
                change: "add"
            }).then(function(x) {
                toast.pop("Successfully answered hugg")
                return 1;
            });

        }); //end then

    } //end function

    $scope.chatUserRef = $firebase(ref.child("users").child("data").child($scope.currentUser.profileID).child("chat")).$asArray();
    $scope.chatRef = $firebase(ref.child("chat")).$asArray();

    $scope.startChat = function startChat(otherProfileID) {
        $scope.chatUserRef.$loaded().then(function(data)
                                          {
            //check whether there has been a chat between the users
            if(data.$getRecord(otherProfileID) == null)
            {
                $scope.chatRef.$loaded().then(function(chatRefData)
                 {
                    var newChatID = Math.floor(Math.random() * (9999999999 - 1000000000 + 1) + 1000000000);
                    while ($scope.chatRef.$getRecord(newChatID) != null) {
                        newChatID = Math.floor(Math.random() * (9999999999 - 1000000000 + 1) + 1000000000);
                    }
                    console.log(newChatID);
                    $firebase(ref.child("chat").child(newChatID)).$set({
                        profileIDA: $scope.currentUser.profileID,
                        profileIDB: otherProfileID,
                        chatID: newChatID
                    }).then(function(x){
                        $firebase(ref.child("users").child("data").child($scope.currentUser.profileID).child("chat").child(otherProfileID)).$set({
                            otherProfileID: otherProfileID,
                            chatID: newChatID
                        }).then(function(y){
                             $firebase(ref.child("users").child("data").child(otherProfileID).child("chat").child(otherProfileID)).$set({
                            otherProfileID: $scope.currentUser.profileID,
                            chatID: newChatID
                        }).then(function(y){
                                 console.log("Successfully created chat with ID "+newChatID);
                                 return 1;
                             });
                        })
                    })
                })
            }
            
            else{
               console.log("already existing");
                $scope.chatUserRef.$loaded().then(function(data)
                                                  {
                    var chatID = data.$getRecord(otherProfileID).chatID;
                    console.log(chatID);
                    $state.go('app.chat', {chatID: chatID});
                })
            }
        })
    };

}) //end controller

.controller('ProfileCtrl', function($scope, $firebase, Auth, UserInfo, helper, localstorage, $stateParams, $ionicPopover) {

    //initialize stuff
    $scope.currentUser = localstorage.getObject('userData');
    var ref = new Firebase("https://huggr.firebaseio.com/");
    $scope.orderOwnHuggRef = $firebase(ref.child("hugg").orderByChild('reqProfileID').equalTo($scope.currentUser.profileID).limitToFirst(100)).$asArray();
    $scope.orderOtherHuggRef = $firebase(ref.child("hugg").orderByChild('answerProfileID').equalTo($scope.currentUser.profileID).limitToFirst(100)).$asArray();
    $scope.huggRef = $firebase(ref.child("hugg")).$asArray();

    $scope.userRatingForView = $scope.currentUser.rating;

    //show data in profile
    var userObject = $firebase(ref.child("users").child("data").child($scope.currentUser.profileID)).$asObject();
    userObject.$bindTo($scope, "currentUser").then(function() {
        $scope.currentUser.age = helper.calcAge(new Date($scope.currentUser.birthdate));
        localstorage.setObject("userData", $scope.currentUser)
    }); // end bindTo

    //initialize various arrays to save data to
    $scope.unansweredHuggs = {
        hugg: []
    };

    $scope.answeredHuggs = {
        hugg: []
    };

    $scope.unacceptedHuggs = {
        hugg: []
    };

    $scope.ownAcceptedHuggs = {
        hugg: []
    };

    $scope.otherAcceptedHuggs = {
        hugg: []
    };

    $scope.ownDoneHuggs = {
        hugg: []
    };

    $scope.otherDoneHuggs = {
        hugg: []
    };

    $scope.ownHistoryHuggs = {
        hugg: []
    };

    $scope.otherHistoryHuggs = {
        hugg: []
    };

    $scope.historyHuggs = {
        hugg: []
    };
    //waiting on this reference to be loaded
    //this reference is for huggs that this users requested
    //in DB: profileID of user is in reqProfileID field
    $scope.orderOwnHuggRef.$loaded().then(function(data) {

        var i = 0;
        //loop to get all the elements
        while (data.$keyAt(i) != null) {

            //save value from db to record
            var record = data.$getRecord(data.$keyAt(i));

            //unanswered huggs are also not accepted and not done
            if (record.answered == 0) {
                $scope.unansweredHuggs.hugg.push({
                    "huggID": record.huggID,
                    "lat": record.reqLat,
                    "long": record.reqLong,
                    "reqTime": record.reqTime,
                    "reqLocation": record.reqLocation
                }); //end push

            } //endif


            //get huggs that the user requested, somebody else answered them but they are not yet done
            //corresponding button is acceptHugg() or declineHugg()
            if (record.answered == 1 && record.done == 0 && record.accepted == 0) {
                $scope.answeredHuggs.hugg.push({
                    "huggID": record.huggID,
                    "lat": record.reqLat,
                    "long": record.reqLong,
                    "reqTime": record.reqTime,
                    "answerProfileID": record.answerProfileID,
                    "answerTime": record.answerTime,
                    "answerPicture": record.answerPicture,
                    "answerGender": record.answerGender,
                    "answerFirstName": record.answerFirstName,
                    "reqLocation": record.reqLocation
                }); //end push
            } //end if

            //get huggs that the user requested, somebody else answered them and the requesting user has already accepted the hugg
            //the hugg has not yet taken place
            //corresponding button is declineHugg() and markDone()
            if (record.answered == 1 && record.done == 0 && record.accepted == 1) {
                $scope.ownAcceptedHuggs.hugg.push({
                    "huggID": record.huggID,
                    "lat": record.reqLat,
                    "long": record.reqLong,
                    "reqTime": record.reqTime,
                    "answerProfileID": record.answerProfileID,
                    "answerTime": record.answerTime,
                    "answerPicture": record.answerPicture,
                    "answerGender": record.answerGender,
                    "answerFirstName": record.answerFirstName,
                    "reqLocation": record.reqLocation
                }); //end push
            } //end if

            //get huggs that are done and requested by this user
            //corresponding: Rating
            if (record.done == 1 && record.rating.totalRating == ".") {
                console.log(record.huggID);
                $scope.ownDoneHuggs.hugg.push({
                    "huggID": record.huggID,
                    "lat": record.reqLat,
                    "long": record.reqLong,
                    "reqTime": record.reqTime,
                    "answerProfileID": record.answerProfileID,
                    "answerTime": record.answerTime,
                    "answerPicture": record.answerPicture,
                    "answerGender": record.answerGender,
                    "answerFirstName": record.answerFirstName,
                    "reqRating": record.rating.reqRating,
                    "reqLocation": record.reqLocation
                }); //end push
            } //end if

            //get huggs that are done and requested by this user
            //corresponding: Rating
            if (record.done == 1 && record.rating.totalRating != ".") {
                $scope.historyHuggs.hugg.push({
                    "huggID": record.huggID,
                    "lat": record.reqLat,
                    "long": record.reqLong,
                    "reqTime": record.reqTime,
                    "answerProfileID": record.answerProfileID,
                    "answerPicture": record.answerPicture,
                    "answerGender": record.answerGender,
                    "answerFirstName": record.answerFirstName,
                    "reqRating": record.rating.totalRating,
                    "reqLocation": record.reqLocation
                }); //end push
            } //end if


            i++;
        } //end while
    }); //end loaded()

    //waitig on this reference to be loadd
    //this reference is for huggs that other users requested and that this user answered
    //in DB: profileID of user is in answerProfileID field
    $scope.orderOtherHuggRef.$loaded().then(function(data) {

        var i = 0;
        //loop to get all elements
        while (data.$keyAt(i) != null) {

            //save element from DB to record
            var record = data.$getRecord(data.$keyAt(i));

            //unanswered huggs are also not accepted and not done
            //corresponding button is revokeAnswer()
            if (record.answered == 1 && record.accepted == 0) {
                $scope.unacceptedHuggs.hugg.push({
                    "huggID": record.huggID,
                    "lat": record.reqLat,
                    "long": record.reqLong,
                    "reqTime": record.reqTime,
                    "reqProfileID": record.reqProfileID,
                    "reqPicture": record.reqPicture,
                    "reqGender": record.reqGender,
                    "reqRating": record.reqRating,
                    "reqFirstName": record.reqFirstName,
                    "reqLocation": record.reqLocation
                }); //end push
            } //endif

            //the user has answered this hugg and the requesting user has accepted the answer
            //the hugg has not yet taken place
            //corresponding button is declineHugg()
            if (record.answered == 1 && record.accepted == 1 && record.done == 0) {
                $scope.otherAcceptedHuggs.hugg.push({
                    "huggID": record.huggID,
                    "lat": record.reqLat,
                    "long": record.reqLong,
                    "reqTime": record.reqTime,
                    "reqProfileID": record.reqProfileID,
                    "reqPicture": record.reqPicture,
                    "reqGender": record.reqGender,
                    "reqRating": record.reqRating,
                    "reqFirstName": record.reqFirstName,
                    "reqLocation": record.reqLocation
                }); //end push
            } //endif

            //queries for huggs that other users request and this user answered the hugg
            //the hugg is done
            //corresponding element: Rating
            if (record.done == 1 && record.rating.totalRating == ".") {
                console.log(record.huggID);
                $scope.otherDoneHuggs.hugg.push({
                    "huggID": record.huggID,
                    "lat": record.reqLat,
                    "long": record.reqLong,
                    "reqTime": record.reqTime,
                    "reqProfileID": record.reqProfileID,
                    "reqPicture": record.reqPicture,
                    "reqGender": record.reqGender,
                    "reqFirstName": record.reqFirstName,
                    "answerRating": record.rating.answerRating,
                    "reqLocation": record.reqLocation
                }); //end push
            } //end if

            if (record.done == 1 && record.rating.totalRating != ".") {
                $scope.historyHuggs.hugg.push({
                    "huggID": record.huggID,
                    "lat": record.reqLat,
                    "long": record.reqLong,
                    "reqTime": record.reqTime,
                    "reqProfileID": record.reqProfileID,
                    "reqPicture": record.reqPicture,
                    "reqGender": record.reqGender,
                    "reqFirstName": record.reqFirstName,
                    "answerRating": record.rating.totalRating,
                    "reqLocation": record.reqLocation
                }); //end push
            } //end if

            i++;
        } //end while


        /*******************************************************************************************
         *                                                                                          *
         *           THIS BLOCK SHOWS HOW THE DATA RCIEVED FROM THE QUERIES CAN BE USED!            *
         *                       PLEASE DELETE FOR FINAL VERSION                                    *
         *                                                                                          *
         *******************************************************************************************/
        console.log("Profile of User")
        console.log("Huggs from you that nobody has yet answered:");
        for (i = 0; i < $scope.unansweredHuggs.hugg.length; i++) {
            console.log("hallo");
            console.log(i + " " + $scope.unansweredHuggs.hugg[i].huggID);
            console.log($scope.unansweredHuggs);

        }
        console.log("\nHuggs from you that someone else answered and you have not yet accepted:");
        for (i = 0; i < $scope.answeredHuggs.hugg.length; i++) {
            console.log(i + " " + $scope.answeredHuggs.hugg[i].huggID);
            console.log($scope.answeredHuggs);

        }
        console.log("\nHuggs that you answered but the other person has not yet accepted:");
        for (i = 0; i < $scope.unacceptedHuggs.hugg.length; i++) {
            console.log(i + " " + $scope.unacceptedHuggs.hugg[i].huggID);
            console.log($scope.unacceptedHuggs);
        }
        console.log("\nHuggs that someone else answered and you accepted");
        for (i = 0; i < $scope.ownAcceptedHuggs.hugg.length; i++) {
            console.log(i + " " + $scope.ownAcceptedHuggs.hugg[i].huggID);
        }
        console.log("\nHuggs that you answered and the other person accepted");
        for (i = 0; i < $scope.otherAcceptedHuggs.hugg.length; i++) {
            console.log(i + " " + $scope.otherAcceptedHuggs.hugg[i].huggID);
        }
        console.log("\nHuggs that you requested and that are done");
        for (i = 0; i < $scope.ownDoneHuggs.hugg.length; i++) {
            console.log(i + " " + $scope.ownDoneHuggs.hugg[i].huggID);
            if ($scope.ownDoneHuggs.hugg[i].reqRating == ".") {
                console.log("Please rate this hugg!");
            } else {
                console.log("Your rating was " + $scope.ownDoneHuggs.hugg[i].reqRating);
            }
            if ($scope.ownDoneHuggs.hugg[i].answerRating == ".") {
                console.log("Waiting for the other user to rate!");
            } else {
                console.log("The other rating was " + $scope.ownDoneHuggs.hugg[i].answerRating);
            }
            if ($scope.ownDoneHuggs.hugg[i].totalRating != ".") {
                console.log("The rating for this hugg is " + $scope.ownDoneHuggs.hugg[i].totalRating);
            }
        }

        console.log("\nHuggs that you answered and that are done");
        for (i = 0; i < $scope.otherDoneHuggs.hugg.length; i++) {
            console.log(i + " " + $scope.otherDoneHuggs.hugg[i].huggID);
            if ($scope.otherDoneHuggs.hugg[i].answerRating == ".") {
                console.log("Please rate this hugg!");
            } else {
                console.log("Your rating was " + $scope.otherDoneHuggs.hugg[i].answerRating);
            }
            if ($scope.otherDoneHuggs.hugg[i].reqRating == ".") {
                console.log("Waiting for the other user to rate!");
            } else {
                console.log("The other rating was " + $scope.otherDoneHuggs.hugg[i].reqRating);
            }
            if ($scope.otherDoneHuggs.hugg[i].totalRating != ".") {
                console.log("The rating for this hugg is " + $scope.otherDoneHuggs.hugg[i].totalRating);
            }
        }

    }); //end then

    //show users currently blocked

    //doesn't work with currentUser ...
    var userArray = $firebase(ref.child("users").child("data").child($scope.currentUser.profileID)).$asObject();
    userArray.$loaded().then(function(data) {
        $scope.profileIDs = data.blocked;
        if (Object.keys($scope.profileIDs)[0] == "1000000000001") {
            $scope.noBlockedUsers = true;
        } else {
            $scope.blockedUsers = [];
            $scope.noBlockedUsers = false;
            var p = $scope.profileIDs;
            for (var key in p) {
                if (p.hasOwnProperty(key) && key != "1000000000001") {
                    UserInfo.getProfile(p[key]).then(function(value) {
                        $scope.returnedProfile = value;
                        $scope.blockedUsers.push($scope.returnedProfile);
                    });
                }
            }
        }
    });

    //remove users from block list
    $scope.unblockUser = function unblockUser(unblockProfileID) {
        $firebase(ref.child("users").child("data").child($scope.currentUser.profileID).child("blocked").child(unblockProfileID)).$remove().then(function(y) {
            console.log("Successfully unblocked user");
            return 1;
        });

    }; //end function

    //remove huggs that nobody has answered yet from unanswered huggs list
    $scope.removeHugg = function removeHugg(huggID) {
        $firebase(ref.child("hugg")).$remove(huggID).then(function(data) {

        }).then(function(data) {
            console.log("Successfully removed hugg");
            return 1;
        }); //end then
    }; //end function

    //accept a hugg answer to a request by this user
    $scope.acceptHugg = function acceptHugg(huggID, answerProfileID) {
        $firebase(ref.child("hugg").child(huggID)).$update({
            accepted: 1
        }).then(function(data) {
            var date = new Date();
            var today = date.getTime();

            //add notification for user that requested the hugg
            $firebase(ref.child("users").child("data").child(answerProfileID).child("notifications").child(huggID)).$set({
                huggID: huggID,
                firstName: $scope.currentUser.firstname,
                picture: $scope.currentUser.picture,
                time: today,
                profileID: $scope.currentUser.profileID,
                type: "accept",
                change: "add"
            }).then(function(x) {
                console.log("successfully accepted hugg!");
                return 1;
            })

        }); //end then

    }; //end function

    //decline a hugg answer to a request that was made by this user
    $scope.declineHugg = function declineHugg(huggID, answerProfileID) {

        $firebase(ref.child("hugg").child(huggID)).$update({
            answered: 0,
            accepted: 0,
            answerProfileID: null,
            answerPicture: null,
            answerGender: null,
            answerTime: null,
            answerFirstName: null,
            answerRating: null
        }).then(function(x) {

            $firebase(ref.child("hugg").child(huggID).child("blocked").child(answerProfileID)).$set({
                1: answerProfileID
            }).then(function(y) {
                var date = new Date();
                var today = date.getTime();

                //add notification for user that requested the hugg
                $firebase(ref.child("users").child("data").child(answerProfileID).child("notifications").child(huggID)).$set({
                    huggID: huggID,
                    firstName: $scope.currentUser.firstname,
                    picture: $scope.currentUser.picture,
                    time: today,
                    profileID: $scope.currentUser.profileID,
                    type: "decline",
                    change: "add"
                }).then(function(x) {
                    console.log("successfully declined hugg!");
                    return 1;
                })
            }); //end then
        });

    };
    //revoke an answer to a hugg (the hugg is requested from somebody else, the user answered the hugg, the hugg is not yet accepted)
    //the user doesn't want to participate in the offered hugg
    $scope.revokeAnswer = function revokeAnswer(huggID, reqProfileID) {

        $firebase(ref.child("hugg").child(huggID)).$update({
            answered: 0,
            accepted: 0,
            answerProfileID: null,
            answerPicture: null,
            answerGender: null,
            answerTime: null,
            answerFirstName: null,
            answerRating: null
        }).then(function(x) {
            var date = new Date();
            var today = date.getTime();

            //add notification for user that requested the hugg
            $firebase(ref.child("users").child("data").child(reqProfileID).child("notifications").child(huggID)).$set({
                huggID: huggID,
                firstName: $scope.currentUser.firstname,
                picture: $scope.currentUser.picture,
                time: today,
                profileID: $scope.currentUser.profileID,
                type: "answer",
                change: "remove"
            }).then(function(x) {
                console.log("Successfully revoked hugg answer!");
                return 1;
            });
        }); //end then
    }; //end function

    //after the hugg has been aswered and th answer has been accepted the hugg takes place
    //after that the hugg is marked as done
    //after this the hugg can be rated
    $scope.markDone = function markDone(huggID) {

        //define ref for huggs
        $scope.huggRef.$loaded().then(function(huggData) {
            //load infos for selected hugg
            var record = huggData.$getRecord(huggID);
            var otherProfileID
            if (record.reqProfileID == $scope.currentUser.profileID) {
                otherProfileID = record.answerProfileID;
            } else {
                otherProfileID = record.reqProfileID;
            }

            //define ref for users
            $scope.userRef = $firebase(ref.child("users").child("data")).$asArray();
            $scope.userRef.$loaded().then(function(userData) {

                //load current number of huggs for both users and add 1
                var reqNumberHuggs = userData.$getRecord(record.reqProfileID).numberHuggs + 1;
                var answerNumberHuggs = userData.$getRecord(record.answerProfileID).numberHuggs + 1;

                //update status in huggRef DB
                $firebase(ref.child("hugg").child(huggID)).$update({
                    done: 1
                }).then(function(x) {
                    //update info on number of huggs for answerer
                    $firebase(ref.child("users").child("data").child(record.answerProfileID)).$update({
                        numberHuggs: answerNumberHuggs
                    }).then(function(y) {
                        //finalize
                        //add notification for user that requested the hugg
                        $firebase(ref.child("users").child("data").child(otherProfileID).child("notifications").child(huggID)).$set({
                            huggID: huggID,
                            firstName: $scope.currentUser.firstname,
                            picture: $scope.currentUser.picture,
                            time: today,
                            profileID: $scope.currentUser.profileID,
                            type: "done",
                            change: "add"
                        }).then(function(x) {
                            console.log("successfully marked as done!");
                            return 1;
                        })
                    }); //end then (finalize)
                }); //end then (update answerer)
            }); //end then (load userRef)
        });
    }; //end function

    //the user that requested the hugg can rate the user that answered
    $scope.rateAnswerHugg = function rateAnswerHugg(huggID, rating, answerProfileID) {

        //get rating of other user
        //if the rating is "." the other user has not yet set the rating, if it's a number the user has set a rating
        //in this case the total rating is calulated and added to the db
        $scope.huggRef.$loaded().then(function(huggData) {
            var reqRating = huggData.$getRecord(huggID).rating.reqRating;
            if (reqRating != ".") {
                var total = (reqRating + rating) / 2;
                $firebase(ref.child("hugg").child(huggID).child("rating")).$update({
                    totalRating: total
                }); //end updae
            }
            //add the rating of the user to the db
            $firebase(ref.child("hugg").child(huggID).child("rating")).$update({
                answerRating: rating
            }).then(function(x) {

                //calculates the rating of the other user
                //the data of the other user is loaded and then then his avarage rating is mulitplied with the number of Huggs
                //then the rating for this hugg is added and the result is devided by the new number of huggs
                //the result is the new avarage rating for the user and is saved to the db
                $scope.userRef = $firebase(ref.child("users").child("data")).$asArray();
                $scope.userRef.$loaded().then(function(userData) {

                    var answerRating = (userData.$getRecord(answerProfileID).rating * (userData.$getRecord(answerProfileID).numberHuggs - 1) + rating) / (userData.$getRecord(answerProfileID).numberHuggs);

                    $firebase(ref.child("users").child("data").child(answerProfileID)).$update({
                        rating: answerRating
                    }).then(function(y) {
                        console.log("Successfully rated");
                        return 1;
                    }); //end update

                }); //end then

            }); //end update
        });

    }; //end function

    //the user that answered the hugg can rate the user that requested the hugg
    $scope.rateReqHugg = function rateReqHugg(huggID, rating, reqProfileID) {

        $scope.huggRef.$loaded().then(function(huggData) {

            //get rating of other user
            //if the rating is "." the other user has not yet set the rating, if it's a number the user has set a rating
            //in this case the total rating is calulated and added to the db
            var answerRating = huggData.$getRecord(huggID).rating.answerRating;
            if (reqRating != ".") {
                var total = (answerRating + rating) / 2;
                $firebase(ref.child("hugg").child(huggID).child("rating")).$update({
                    totalRating: total
                }); //end updae
            }

            //add the rating of the user to the db
            $firebase(ref.child("hugg").child(huggID).child("rating")).$update({
                reqRating: rating
            }).then(function(x) {

                //calculates the rating of the other user
                //the data of the other user is loaded and then then his avarage rating is mulitplied with the number of Huggs
                //then the rating for this hugg is added and the result is devided by the new number of huggs
                //the result is the new avarage rating for the user and is saved to the db
                $scope.userRef = $firebase(ref.child("users").child("data")).$asArray();
                $scope.userRef.$loaded().then(function(userData) {

                    var reqRating = (userData.$getRecord(reqProfileID).rating * (userData.$getRecord(reqProfileID).numberHuggs - 1) + rating) / (userData.$getRecord(reqProfileID).numberHuggs);

                    $firebase(ref.child("users").child("data").child(reqProfileID)).$update({
                        rating: reqRating
                    }).then(function(y) {
                        console.log("Successfully rated");
                        return 1;
                    }); //end update

                }); //end then

            }); //end update
        }); //end loaded()

    }; //end function

}) //end ProfileCtrl

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
    userObject.$bindTo($scope, "userData").then(localstorage.setObject("userData", $scope.userData), function(x) {
        $scope.userData.birthdate = new Date($scope.userData.birthdate);
    });
    //Todo: den tatsächlichen Connect zu dem jeweils anderen dienst

    $scope.userData.birthdate = new Date($scope.userData.birthdate);

    // $scope.date = $scope.userDate.birthdate.toDateString();
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



.controller('homeCtrl', function($scope, $ionicLoading, $cordovaGeolocation, $ionicPopover, $state, localstorage, $firebase) {
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

    //function that is executed on "Search"-Click in Popover
    $scope.displayResults = function() {

        var male = $scope.huggRequest.male;
        var female = $scope.huggRequest.female;
        var range = $scope.huggRequest.range;
        //reset huggRequest Object values
        $scope.huggRequest.male = "none";
        $scope.huggRequest.female = "none";
        $scope.huggRequest.range = "none";

        //remove popover when showing results
        $scope.popover.hide();

        //this opens the results view with the parameters
        $state.go('app.results', {
            male: male,
            female: female,
            range: range
        }); // end go
    }; //end function

    var ref = new Firebase("https://huggr.firebaseio.com/");
    $scope.currentUser = localstorage.getObject('userData');

    //watches for changes in data - maybe use bindTo?
    var obj = $firebase(ref.child("users").child("data").child($scope.currentUser.profileID).child("notifications")).$asObject();
    var unwatch = obj.$watch(function() {
        console.log("data changed!");
    });


    if ($scope.currentUser.notifications != null) {
        console.log("number of notifications: " + Object.keys($scope.currentUser.notifications).length);
        var p = $scope.currentUser.notifications
        for (var key in p) {
            if (p.hasOwnProperty(key)) {
                console.log("Benachrichtigung: " + p[key].firstName + " HuggID " + p[key].huggID + " Type: " + p[key].type + ", " + p[key].change);
            }
        }
        //console.log($scope.currentUser.notifications);
    }


})

.controller('resultCtrl', function($scope, Auth, $firebase, $stateParams, localstorage, $cordovaGeolocation, $q, $ionicLoading, $http, $state, toast) {

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
    }
    if ($stateParams.range == "Forever alone 100 km") {
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

                    console.log(position.coords.latitude + " " + position.coords.longitude);
                    var reverseGeocode = $http.get("http://maps.googleapis.com/maps/api/geocode/json?latlng=" + position.coords.latitude + "," + position.coords.longitude);
                    reverseGeocode.then(function(result) {
                        var reqLocation = result.data.results[0].address_components[1].long_name + ", " + result.data.results[0].address_components[2].long_name;
                        console.log(reqLocation);

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
                            reqTime: today,
                            reqFirstName: $scope.currentUser.firstname,
                            reqPicture: $scope.currentUser.picture,
                            reqRating: $scope.currentUser.rating,
                            blocked: $scope.currentUser.blocked,
                            reqLocation: reqLocation

                        }).then(function(x) {

                            $firebase(ref.child("hugg").child(huggID).child("rating")).$set({
                                reqRate: ".",
                                answerRate: ".",
                                totalRating: "."
                            }).then(function(y) {
                                toast.pop("Successfully requested hugg!")
                                $state.go("app.home");
                                console.log("Successfully requested hugg " + huggID);
                                return 1;
                            }); //end then

                        }); //end then (rating)
                    }); //end reverseGeocode
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
                                                "reqTime": record.reqTime,
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
        $scope.resultList = array;
        console.log(array);
    });

}) //end resultCTRL

.controller('LogoutCtrl', function($scope, Auth) {
    $scope.auth = Auth;
    //function for logout
    $scope.logout = function() {

        //disconnects user from auth object, needs to relogin
        $scope.auth.$unauth();

        //reloads window to show login fields
        window.location.reload();
    } // end function
})


.controller('ChatCtrl', function($scope, $stateParams, $firebase, localstorage) {
    
    chatID = $stateParams.chatID;
    console.log(chatID);

    //Reference to Firebase
    $scope.currentUser = localstorage.getObject('userData');
    var sync = $firebase(new Firebase("https://huggr.firebaseio.com/chat/"+chatID));
    $scope.chatList = sync.$asArray();


    $scope.messageInput;
    $scope.chatData;

    $scope.sendMessage = function() {
        $scope.chatList.$add({
            message: $scope.messageInput,
            user: $scope.currentUser.firstname
        });
        $scope.messageInput = '';
    }

    var obj = sync.$asObject();
    obj.$loaded().then(function() {
        console.log(obj);
        obj.$bindTo($scope, "chatData");
    });
});