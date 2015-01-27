angular.module('starter.controllers', [])

.factory("Auth", ["$firebaseAuth",
    function($firebaseAuth) {
        var ref = new Firebase("https://huggr.firebaseio.com/");
        return $firebaseAuth(ref);
    }
])
.factory('UserInfo', ["$firebase", "$q",
    function($firebase, $q) {

        return {
            getProfile: function(ID) {
                var ref = new Firebase("https://huggr.firebaseio.com/users/data");
                dataRef = $firebase(ref.orderByKey().equalTo(ID.toString())).$asArray();
                return dataRef.$loaded().then(function(data) {
                    console.log(data.$getRecord(ID));
                    return angular.extend({}, data.$getRecord(ID)); //much shorter than transcribing properties manually
                }).catch(function(error) {
                    console.error("Error getting UserInfo: ", error.message);
                    return error;
                });
            }
        };
    }
])
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
.factory('huggActions', ["$firebase", "toast", "$state", "$http", "$q",

    function($firebase, toast, $state, $http, $q) {
        var ref = new Firebase("https://huggr.firebaseio.com/"),
            huggRef = $firebase(ref.child("hugg")).$asArray();

        return {

            answerHugg: function(huggID, currentUser, profileID) {
                //adds info of user that accepts hugg to database
                $firebase(ref.child("hugg").child(huggID)).$update({
                    answered: 1,
                    answerProfileID: currentUser.profileID,
                    answerTime: Firebase.ServerValue.TIMESTAMP,
                    answerPicture: currentUser.picture,
                    answerGender: currentUser.gender,
                    answerFirstName: currentUser.firstName,
                    answerRating: currentUser.rating

                }).then(function(data) {

                    //add notification for user that requested the hugg
                    $firebase(ref.child("users").child("data").child(profileID).child("notifications").child(huggID)).$set({
                        huggID: huggID,
                        firstName: currentUser.firstName,
                        picture: currentUser.picture,
                        time: Firebase.ServerValue.TIMESTAMP,
                        profileID: currentUser.profileID,
                        type: "answer",
                        change: "add"
                    }).then(function(x) {
                        toast.pop("Hugg answered");
                        $state.go("app.home");
                    });

                }); //end then

            }, //end function
            //function to request a hugg in case the presented huggs are not suitable
            requestHugg: function(currentUser, gender, lat, long) {
                //create random huggID
                var huggID = Math.floor(Math.random() * (9999999999 - 1000000000 + 1) + 1000000000);

                //check whether huggID already exists in db
                while ($firebase(ref.child("huggID").orderByKey().equalTo(huggID.toString())).$asArray().$getRecord(huggID) != null) {
                    huggID = Math.floor(Math.random() * (9999999999 - 1000000000 + 1) + 1000000000);
                } //end while

                var reverseGeocode = $http.get("https://maps.googleapis.com/maps/api/geocode/json?latlng=" + lat + "," + long);
                reverseGeocode.then(function(result) {
                    var reqLocation = result.data.results[0].address_components[1].long_name + ", " + result.data.results[0].address_components[2].long_name;

                    //save data to firebase in new child with calculated huggID
                    $firebase(ref.child("hugg").child(huggID)).$set({
                        huggID: huggID,
                        reqLat: lat,
                        reqLong: long,
                        FilterGender: gender,
                        done: 0,
                        answered: 0,
                        accepted: 0,
                        reqProfileID: currentUser.profileID,
                        reqGender: currentUser.gender,
                        reqTime: Firebase.ServerValue.TIMESTAMP,
                        reqFirstName: currentUser.firstName,
                        reqPicture: currentUser.picture,
                        reqRating: currentUser.rating,
                        blocked: currentUser.blocked,
                        reqLocation: reqLocation,
                        huggReqRating: -1,
                        huggAnswerRating: -1,
                        huggTotalRating: -1
                    }).then(function(x) {
                        toast.pop("Hugg requested")
                        $state.go("app.home");
                    }); //end then (rating)
                }); //end reverseGeocode
            }, // end function   

            //remove huggs that nobody has answered yet from unanswered huggs list
            removeHugg: function(huggID) {
                $firebase(ref.child("hugg")).$remove(huggID).then(function(data) {
                    toast.pop("Hugg removed");
                }); //end then
            }, //end function

            //accept a hugg answer to a request by this user
            acceptHugg: function(currentUser, huggID, answerProfileID) {
                $firebase(ref.child("hugg").child(huggID)).$update({
                    accepted: 1,
                    acceptTime: Firebase.ServerValue.TIMESTAMP
                }).then(function(data) {

                    //add notification for user that requested the hugg
                    $firebase(ref.child("users").child("data").child(answerProfileID).child("notifications").child(huggID)).$set({
                        huggID: huggID,
                        firstName: currentUser.firstName,
                        picture: currentUser.picture,
                        time: Firebase.ServerValue.TIMESTAMP,
                        profileID: currentUser.profileID,
                        type: "accept",
                        change: "add"
                    }).then(function(x) {
                        toast.pop("Hugg accepted");
                    })

                }) //end then

            }, //end function

            //decline a hugg answer to a request that was made by this user
            declineHugg: function(currentUser, huggID, answerProfileID) {

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
                        0: answerProfileID
                    }).then(function(y) {
                        //add notification for user that requested the hugg
                        $firebase(ref.child("users").child("data").child(answerProfileID).child("notifications").child(huggID)).$set({
                            huggID: huggID,
                            firstName: currentUser.firstName,
                            picture: currentUser.picture,
                            time: Firebase.ServerValue.TIMESTAMP,
                            profileID: currentUser.profileID,
                            type: "accept",
                            change: "remove"
                        }).then(function(x) {
                            toast.pop("Hugg declined");
                        });
                    }); //end then
                });

            },

            //revoke an answer to a hugg (the hugg is requested from somebody else, the user answered the hugg, the hugg is not yet accepted)
            //the user doesn't want to participate in the offered hugg
            revokeAnswer: function(currentUser, huggID, reqProfileID) {

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
                    //add notification for user that requested the hugg
                    $firebase(ref.child("users").child("data").child(reqProfileID).child("notifications").child(huggID)).$set({
                        huggID: huggID,
                        firstName: currentUser.firstName,
                        picture: currentUser.picture,
                        time: Firebase.ServerValue.TIMESTAMP,
                        profileID: currentUser.profileID,
                        type: "answer",
                        change: "remove"
                    }).then(function(x) {
                        toast.pop("Revoked answer");
                    });
                }); //end then
            }, //end function


            //after the hugg has been aswered and th answer has been accepted the hugg takes place
            //after that the hugg is marked as done
            //after this the hugg can be rated
            markDone: function(currentUser, huggID) {

                var huggRef = $firebase(ref.child("hugg").orderByKey().equalTo(huggID.toString())).$asArray();
                //define ref for huggs
                huggRef.$loaded().then(function(huggData) {

                    function loadHugg() {
                        var def = $q.defer();
                        def.resolve(huggData.$getRecord(huggID));
                        return def.promise;
                    } //end function load

                    loadHugg().then(function(record) {
                        //load infos for selected hugg
                        var otherProfileID;
                        if (record.reqProfileID == currentUser.profileID) {
                            otherProfileID = record.answerProfileID;
                        } else {
                            otherProfileID = record.reqProfileID;
                        }

                        //define ref for users
                        var userRefA = $firebase(ref.child("users").child("data").orderByKey().equalTo(record.reqProfileID.toString())).$asArray();
                        userRefA.$loaded().then(function(userDataA) {

                            function loadA() {
                                var def = $q.defer();
                                def.resolve(userDataA.$getRecord(record.reqProfileID));
                                return def.promise;
                            } //end function load

                            loadA().then(function(userDataA) {

                                //load current number of huggs for both users and add 1
                                var reqNumberHuggs = userDataA.numberHuggs + 1;

                                var userRefB = $firebase(ref.child("users").child("data").orderByKey().equalTo(record.answerProfileID.toString())).$asArray();
                                userRefB.$loaded().then(function(userDataB) {

                                    function loadB() {
                                        var def = $q.defer();
                                        def.resolve(userDataB.$getRecord(record.answerProfileID));
                                        return def.promise;
                                    } //end function load

                                    loadB().then(function(userDataB) {

                                        var answerNumberHuggs = userDataB.numberHuggs + 1;

                                        //update status in huggRef DB
                                        $firebase(ref.child("hugg").child(huggID)).$update({
                                            done: 1
                                        }).then(function(x) {
                                            //update info on number of huggs for answerer
                                            $firebase(ref.child("users").child("data").child(record.reqProfileID)).$update({
                                                numberHuggs: reqNumberHuggs
                                            });

                                            $firebase(ref.child("users").child("data").child(record.answerProfileID)).$update({
                                                numberHuggs: answerNumberHuggs
                                            }).then(function(y) {

                                                //finalize
                                                //add notification for user that requested the hugg
                                                $firebase(ref.child("users").child("data").child(otherProfileID).child("notifications").child(huggID)).$set({
                                                    huggID: huggID,
                                                    firstName: currentUser.firstName,
                                                    picture: currentUser.picture,
                                                    time: Firebase.ServerValue.TIMESTAMP,
                                                    profileID: currentUser.profileID,
                                                    type: "done",
                                                    change: "add"
                                                }).then(function(x) {
                                                    return 1;
                                                })
                                            }); //end then (finalize)
                                        }); //end then (update answerer)
                                    });
                                });
                            }); //end then (load userRef)
                        });
                    });
                });
            }, //end function

            //the user that requested the hugg can rate the user that answered
            rateAnswerHugg: function(huggID, rating, answerProfileID, reqHuggRating) {
                var total;
                var deferred = $q.defer();

                //add the rating of the user to the db
                $firebase(ref.child("hugg").child(huggID)).$update({
                    huggAnswerRating: rating
                }).then(function(x) {

                    //calculates the rating of the other user
                    //the data of the other user is loaded and then then his avarage rating is mulitplied with the number of Huggs
                    //then the rating for this hugg is added and the result is devided by the new number of huggs
                    //the result is the new avarage rating for the user and is saved to the db
                    var userRef = $firebase(ref.child("users").child("data").orderByKey().equalTo(answerProfileID.toString())).$asArray();
                    userRef.$loaded().then(function(userData) {

                        function load() {
                            var def = $q.defer();
                            def.resolve(userRef.$getRecord(answerProfileID));
                            return def.promise;
                        } //end function load

                        load().then(function(userData) {
                            var answerRating = (userData.rating * (userData.numberHuggs - 1) + rating) / (userData.numberHuggs);

                            $firebase(ref.child("users").child("data").child(answerProfileID)).$update({
                                rating: answerRating
                            }).then(function(y) {
                                if (reqHuggRating != "-1") {
                                    total = (reqHuggRating + rating) / 2;
                                    deferred.resolve(total);
                                } else {
                                    total = -1;
                                    deferred.resolve(total);
                                }

                            }); //end update
                        });

                    }); //end then

                }); //end update
                return deferred.promise;

            }, //end function

            //the user that answered the hugg can rate the user that requested the hugg
            rateReqHugg: function(huggID, rating, reqProfileID, answerHuggRating) {

                var deferred = $q.defer();
                var total;
                //get rating of other user
                //if the rating is "." the other user has not yet set the rating, if it's a number the user has set a rating
                //in this case the total rating is calulated and added to the db

                //add the rating of the user to the db
                $firebase(ref.child("hugg").child(huggID)).$update({
                    huggReqRating: rating
                }).then(function(x) {

                    //calculates the rating of the other user
                    //the data of the other user is loaded and then then his avarage rating is mulitplied with the number of Huggs
                    //then the rating for this hugg is added and the result is devided by the new number of huggs
                    //the result is the new avarage rating for the user and is saved to the db
                    var userRef = $firebase(ref.child("users").child("data").orderByKey().equalTo(reqProfileID.toString())).$asArray();
                    userRef.$loaded().then(function(userData) {
                        function load() {
                            var def = $q.defer();
                            def.resolve(userRef.$getRecord(reqProfileID));
                            return def.promise;
                        } //end function load

                        load().then(function(userData) {
                            var reqRating = (userData.rating * (userData.numberHuggs - 1) + rating) / (userData.numberHuggs);

                            $firebase(ref.child("users").child("data").child(reqProfileID)).$update({
                                rating: reqRating
                            }).then(function(y) {
                                if (answerHuggRating != "-1") {
                                    total = (answerHuggRating + rating) / 2;
                                    deferred.resolve(total);
                                } else {
                                    total = -1;
                                    deferred.resolve(total);
                                }
                                toast.pop("Hugg rated");
                            }); //end update  
                        });

                    }); //end then

                }); //end update
                return deferred.promise;

            } //end function

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
.service('notifications', ["$rootScope", "$firebase", "$timeout", "toast",

    function($rootScope, $firebase, $timeout, toast) {

        var ref = new Firebase("https://huggr.firebaseio.com/")
        return {
            sync: function(ID) {
                var arr = $firebase(ref.child("users").child("data").child(ID).child("notifications")).$asArray();
                arr.$loaded().then(function(notifications) {
                    $rootScope.notificationData = notifications;
                    arr.$watch(function(event) {
                        switch (event.event) {
                            case "child_removed":
                                toast.pop("Notification deleted!");
                                break;
                            case "child_added":
                                toast.pop("New notification!");
                                break;
                            case "child_changed":
                                toast.pop("New notification!");
                                break;
                        }

                    });
                })
                    .catch(function(error) {
                        console.log("Error:", error);
                    });
            },

            deleteAllNotifications: function(currentUser) {
                $firebase(ref.child("users").child("data").child(currentUser.profileID).child("notifications")).$remove();
            },

            removeNotification: function(currentUser, id) {
                $firebase(ref.child("users").child("data").child(currentUser.profileID).child("notifications").child(id)).$remove();
            }
        };
    }
])
.factory('toast', function($rootScope, $timeout, $ionicPopup, $ionicLoading, $cordovaVibration) {
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
            $cordovaVibration.vibrate(100);


            $timeout(function() {
                myPopup.close();
            }, duration);

        },
        pop: function(msg) {
            var myToast = $ionicLoading.show({
                template: msg,
                noBackdrop: true,
                duration: 1000
            });
            $cordovaVibration.vibrate(100);

        }
    }
})

.directive('input', function($timeout) {
    return {
        restrict: 'E',
        scope: {
            'returnClose': '=',
            'onReturn': '&',
            'onFocus': '&',
            'onBlur': '&'
        },
        link: function(scope, element, attr) {
            element.bind('focus', function(e) {
                if (scope.onFocus) {
                    $timeout(function() {
                        scope.onFocus();
                    });
                }
            });
            element.bind('blur', function(e) {
                if (scope.onBlur) {
                    $timeout(function() {
                        scope.onBlur();
                    });
                }
            });
            element.bind('keydown', function(e) {
                if (e.which == 13) {
                    if (scope.returnClose) element[0].blur();
                    if (scope.onReturn) {
                        $timeout(function() {
                            scope.onReturn();
                        });
                    }
                }
            });
        }
    }
})

.controller('ChatCtrl', function($scope, $stateParams, $firebase, localstorage, toast, $ionicScrollDelegate) {

    chatID = $stateParams.chatID;
    $scope.ctitle = $stateParams.chatTitle;
    console.log("ChatID:" + chatID);

    var isIOS = ionic.Platform.isWebView() && ionic.Platform.isIOS();

    //Reference to Firebase
    $scope.currentUser = localstorage.getObject('userData');
    var sync = $firebase(new Firebase("https://huggr.firebaseio.com/chat/" + chatID + "/message"));
    $scope.chatList = sync.$asArray();

    $scope.messageInput = "";
    $scope.chatData;

    $scope.inputUp = function() {
        if (isIOS) $scope.data.keyboardHeight = 216;
        $timeout(function() {
            $ionicScrollDelegate.scrollBottom(true);
        }, 300);

    };

    $scope.inputDown = function() {
        if (isIOS) $scope.data.keyboardHeight = 0;
        $ionicScrollDelegate.resize();
    };

    $scope.closeKeyboard = function() {
        // cordova.plugins.Keyboard.close();
    };

    $scope.sendMessage = function() {
        $scope.chatList.$add({
            message: $scope.messageInput,
            user: $scope.currentUser.profileID,
            picture: $scope.currentUser.picture,
            time: Date.now(),
            name: $scope.currentUser.firstName
        }).then(function(sync) {
            var id = sync.key();
            toast.pop("Message sent!");
            $scope.messageInput = '';
            $ionicScrollDelegate.scrollBottom();

        });
    };

    var obj = sync.$asObject();
    obj.$loaded().then(function() {
        obj.$bindTo($scope, "chatData").then(function() {
            $ionicScrollDelegate.scrollBottom();

        });
    });
})

.controller('ChatOverviewCtrl', function($scope, $firebase, localstorage, UserInfo, $q, $filter) {

    $scope.currentUser = localstorage.getObject('userData');
    var sync = $firebase(new Firebase("https://huggr.firebaseio.com/users/data/" + $scope.currentUser.profileID + "/chat/"));
    $scope.chatList = sync.$asArray();

    $scope.chatResults = [];
    $scope.bla = [];

    $scope.chatList.$loaded().then(function() {
        for (var i = 0; i < ($scope.chatList).length; i++) {
            $scope.bla.push($scope.chatList[i].chatID)
        };
        //


        for (var i = 0; i < ($scope.chatList).length; i++) {

            var deferred = $q.defer();
            UserInfo.getProfile($scope.chatList[i].otherProfileID, deferred).then(function(value) {
                var p = value.chat;
                var s = $scope.bla;

                for (var key in p) {
                    if (p.hasOwnProperty(key)) {
                        for (var i = 0; i < s.length; i++) {
                            if (s[i] == p[key].chatID) {
                                value.chref = s[i];
                                $scope.chatResults.push(value);
                            };

                        };

                    }
                };
            });
        };

    });



})

//this controller is addressed when a link like this is opened: app/profile/{pofileid}/{huggid}
//These links are only used to show profiles of people for hugging whereas the "ProfileCtrl" is used to show the own profile
.controller('ExtProfileCtrl', function($scope, $firebase, Auth, UserInfo, helper, localstorage, $stateParams, $state, toast, $q, huggActions, $ionicHistory) {
    //stuff with stateParams
    //In the hugg results when clicking on a offered hugg the user is refered to this page
    //The params are the profileID of the user that offers the hugg and the huggID
    //The huggID is needed so that the answer to the hugg can be mapped on the right huggID
    $scope.$on("$ionicView.enter", function(scopes, states) {    });

    $scope.huggID = $stateParams.huggID;
    $scope.profileID = $stateParams.profileID;
    $scope.data = {age: null};
    $scope.currentUser = localstorage.getObject('userData');
    var ref = new Firebase("https://huggr.firebaseio.com/");

    var deferred = $q.defer();
    UserInfo.getProfile($scope.profileID).then(function(value) {
        $scope.data.age = value.age;
        $scope.data.picture = value.picture;
        $scope.data.lastSeenTime = value.lastSeenTime;
        $scope.data.displayName = value.displayName;
        $scope.data.hobby = value.hobby;
        $scope.data.profileID = value.profileID;
        $scope.data.numberHuggs = value.numberHuggs;
        $scope.data.rating = value.rating;
        $scope.data.firstName = value.firstName;
    }); //end getProfile

    //block a user from ever sending requests again
    $scope.blockUser = function blockUser(blockProfileID) {

        $firebase(ref.child("users").child("data").child($scope.currentUser.profileID).child("blocked").child(blockProfileID)).$set({
            0: blockProfileID
        }).then(function(y) {
            var blockHuggRef = $firebase(ref.child("hugg").orderByChild('reqProfileID').equalTo($scope.currentUser.profileID)).$asArray();
            blockHuggRef.$loaded().then(function(data) {
                var i = 0;
                while (data.$keyAt(i) != null) {
                    $firebase(ref.child("hugg").child(data.$keyAt(i)).child("blocked").child(blockProfileID)).$set({
                        0: blockProfileID
                    });
                    var record = data.$getRecord(data.$keyAt(i));
                    if (record.answerProfileID == blockProfileID) {
                        //decline all huggs that the blocked user has with this user
                        huggActions.declineHugg($scope.currentUser, record.huggID, blockProfileID);
                    }
                    i++;
                }
                toast.pop("Blocked user");
                $ionicHistory.goBack();
                return 1;
            });
        }); //end set

    }; //end function

    //answer to a hugg that the user of this currently shown profile has requested
    $scope.answerHugg = function answerHugg(huggID) {

        //accessing controller
        huggActions.answerHugg(huggID, $scope.currentUser, $scope.profileID);

    } //end function

    $scope.chatUserRef = $firebase(ref.child("users").child("data").child($scope.currentUser.profileID).child("chat")).$asArray();
    $scope.chatRef = $firebase(ref.child("chat")).$asArray();

    $scope.startChat = function startChat(otherProfileID) {
        $scope.chatUserRef.$loaded().then(function(data) {
            //check whether there has been a chat between the users
            if (data.$getRecord(otherProfileID) == null) {
                $scope.chatRef.$loaded().then(function(chatRefData) {
                    var newChatID = Math.floor(Math.random() * (9999999999 - 1000000000 + 1) + 1000000000);
                    while ($scope.chatRef.$getRecord(newChatID) != null) {
                        newChatID = Math.floor(Math.random() * (9999999999 - 1000000000 + 1) + 1000000000);
                    }
                    console.log(newChatID);
                    $firebase(ref.child("chat").child(newChatID)).$set({
                        profileIDA: $scope.currentUser.profileID,
                        profileIDB: otherProfileID,
                        chatID: newChatID
                    }).then(function(x) {
                        $firebase(ref.child("users").child("data").child($scope.currentUser.profileID).child("chat").child(otherProfileID)).$set({
                            otherProfileID: otherProfileID,
                            chatID: newChatID
                        }).then(function(y) {
                            $firebase(ref.child("users").child("data").child(otherProfileID).child("chat").child(otherProfileID)).$set({
                                otherProfileID: $scope.currentUser.profileID,
                                chatID: newChatID
                            }).then(function(y) {
                                $state.go('app.chat', {
                                    chatID: newChatID
                                });
                            });
                        })
                    })
                })
            } else {
                console.log("already existing");
                $scope.chatUserRef.$loaded().then(function(data) {
                    var chatID = data.$getRecord(otherProfileID).chatID;
                    console.log(chatID);
                    $state.go('app.chat', {
                        chatID: chatID
                    });
                })
            }
        })
    };

}) //end controller
.controller('HuggCtrl', function($scope, $firebase, localstorage, notifications, huggActions, $q, toast) {

    //initialize stuff
    $scope.currentUser = localstorage.getObject('userData');
    var ref = new Firebase("https://huggr.firebaseio.com/");
    notifications.sync($scope.currentUser.profileID);

    var ownHuggObject = $firebase(ref.child("hugg").orderByChild('reqProfileID').equalTo($scope.currentUser.profileID)).$asObject();
    ownHuggObject.$bindTo($scope, "ownHuggData").then(function() {}); // end bindTo

    var otherHuggObject = $firebase(ref.child("hugg").orderByChild('answerProfileID').equalTo($scope.currentUser.profileID)).$asObject();
    otherHuggObject.$bindTo($scope, "otherHuggData").then(function() {}); // end bindTo

    $scope.removeHugg = function(huggID) {
        huggActions.removeHugg(huggID);
    }

    $scope.test = {
        huggTotalRating: null
    };

    $scope.acceptHugg = function(huggID, answerProfileID) {
        huggActions.acceptHugg($scope.currentUser, huggID, answerProfileID);
    }

    $scope.declineHugg = function(huggID, answerProfileID) {
        huggActions.declineHugg($scope.currentUser, huggID, answerProfileID);
    }


    //revoke an answer to a hugg (the hugg is requested from somebody else, the user answered the hugg, the hugg is not yet accepted)
    //the user doesn't want to participate in the offered hugg
    $scope.revokeAnswer = function(huggID, reqProfileID) {
        huggActions.revokeAnswer($scope.currentUser, huggID, reqProfileID);

    }; //end function

    $scope.markDone = function markDone(huggID) {
        huggActions.markDone($scope.currentUser, huggID);
    }

    $scope.rateAnswerHugg = function(huggID, rating, answerProfileID, reqHuggRating) {
        huggActions.rateAnswerHugg(huggID, rating, answerProfileID, reqHuggRating).then(function(total) {
            $scope.totalRating(huggID, total)
        });
    }

    $scope.rateReqHugg = function(huggID, rating, reqProfileID, answerHuggRating) {
        huggActions.rateReqHugg(huggID, rating, reqProfileID, answerHuggRating).then(function(total) {
            $scope.totalRating(huggID, total)
        });
    }

    $scope.totalRating = function(huggID, total) {
        $firebase(ref.child("hugg").child(huggID)).$update({
            huggTotalRating: total
        }).then(function(y) {
            toast.pop("Hugg done");
        });

    }

})
.controller('LogoutCtrl', function($scope, Auth, $state) {
    $scope.auth = Auth;
    //function for logout
    $scope.logout = function() {

        //disconnects user from auth object, needs to relogin
        $scope.auth.$unauth();

        //reloads window to show login fields
        $state.go('app.home');
    } // end function
})
.controller('ProfileCtrl', function($scope, $firebase, UserInfo, localstorage, $stateParams, notifications, toast, $state, $cordovaCamera, $http) {

        /****************Tab 1****************/
        //initialize stuff
        $scope.currentUser = localstorage.getObject('userData');
        var ref = new Firebase("https://huggr.firebaseio.com/");
        notifications.sync($scope.currentUser.profileID);

        $scope.userRatingForView = $scope.currentUser.rating;

        //show data in profile
        var userObject = $firebase(ref.child("users").child("data").child($scope.currentUser.profileID)).$asObject();
        userObject.$bindTo($scope, "currentUser").then(function() {
            localstorage.setObject("userData", $scope.currentUser)
        }); // end bindTo

        var ownHuggObject = $firebase(ref.child("hugg").orderByChild('reqProfileID').equalTo($scope.currentUser.profileID)).$asObject();
        ownHuggObject.$bindTo($scope, "ownHuggData").then(function() {}); // end bindTo

        var otherHuggObject = $firebase(ref.child("hugg").orderByChild('answerProfileID').equalTo($scope.currentUser.profileID)).$asObject();
        otherHuggObject.$bindTo($scope, "otherHuggData").then(function() {}); // end bindTo

        /****************Tab 2****************/

        var connectRef = new Firebase("https://huggr.firebaseio.com/users/");
        $scope.googleRef = $firebase(connectRef.child("signin").child("google")).$asArray();
        $scope.facebookRef = $firebase(connectRef.child("signin").child("facebook")).$asArray();

        var mainref = new Firebase("https://huggr.firebaseio.com/");


        $scope.connect = function(provider) {
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
                                profileID: $scope.currentUser.profileID
                            });
                            $firebase(ref).$update({
                                googleID: authData.google.id
                            });
                            toast.pop("Successfully connected");
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
                                profileID: $scope.currentUser.profileID
                            });
                            $firebase(ref).$update({
                                facebookID: authData.facebook.id
                            });
                            toast.pop("Successfully connected");
                        });
                    }
                });
            }
        }

        document.addEventListener("deviceready", function() {

            var options = {
                quality: 90,
                destinationType: Camera.DestinationType.DATA_URL,
                sourceType: Camera.PictureSourceType.CAMERA,
                allowEdit: true,
                encodingType: Camera.EncodingType.JPEG,
                popoverOptions: CameraPopoverOptions,
                saveToPhotoAlbum: false
            };
            $scope.takeNewPicture = function() {
                $cordovaCamera.getPicture(options).then(function(imageData) {
                    $http({
                        method: 'POST',
                        url: 'http://routefiftyfive.com/huggr/index.php',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        transformRequest: function(obj) {
                            var str = [];
                            for (var p in obj)
                                str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                            return str.join("&");
                        },
                        data: {
                            image: imageData
                        }
                    }).success(function(data, status, headers, config) {
                        $scope.currentUser.picture = data;
                        console.log(status);
                    });
                }, function(err) {
                    // error
                });
            };
        }, false);



        /****************Tab 3****************/
        $scope.noBlockedUsers = true;

        var blockedUserObject = $firebase(ref.child("users").child("data").child($scope.currentUser.profileID).child("blocked")).$asObject();
        blockedUserObject.$bindTo($scope, "blockedUserData").then(function() {
            $scope.blockedUsers = [];
            for (var key in $scope.blockedUserData) {
                if ($scope.blockedUserData.hasOwnProperty(key) && key != "1000000000001" && key != "$id") { //need to filter firebase $id-object
                    var obj = $scope.blockedUserData[key];
                    for (var prop in obj) {
                        if (obj.hasOwnProperty(prop)) {
                            UserInfo.getProfile(obj[prop]).then(function(value) {
                                $scope.returnedProfile = value;
                                $scope.blockedUsers.push($scope.returnedProfile);
                            });
                        }
                    }
                    $scope.noBlockedUsers = true;
                } else {
                    $scope.noBlockedUsers = false;
                }
            }
        }); // end bindTo

        $scope.unblockUser = function(unblockProfileID) {
            $firebase(ref.child("users").child("data").child($scope.currentUser.profileID).child("blocked").child(unblockProfileID)).$remove().then(function(y) {
                var blockHuggRef = $firebase(ref.child("hugg").orderByChild('reqProfileID').equalTo($scope.currentUser.profileID)).$asArray();
                blockHuggRef.$loaded().then(function(data) {
                    var i = 0;
                    while (data.$keyAt(i) != null) {
                        $firebase(ref.child("hugg").child(data.$keyAt(i)).child("blocked").child(unblockProfileID)).$remove();
                        i++;
                    }
                    toast.pop("Unblocked user");
                    $state.go('app.profile')
                    return 1;
                });
            });
        };

    }) //end ProfileCtrl

.controller('aboutCtrl', function($scope, $cordovaGeolocation, $ionicPopover, $state, localstorage, $firebase, toast, notifications) {
    $scope.currentUser = localstorage.getObject('userData');
    var ref = new Firebase("https://huggr.firebaseio.com/");

    $scope.request = {
        message: "",
        subject: ""
    };

    var userObject = $firebase(ref.child("admin").child("support").orderByChild('profileID').equalTo($scope.currentUser.profileID)).$asObject();
    userObject.$bindTo($scope, "supportData").then(function() {

    }); // end bindTo

    $scope.sendRequest = function sendRequest() {
        //console.log($scope.request.message);
        if ($scope.request.message.length > 40 && $scope.request.subject.length > 15) {
            console.log($scope.request.message);
            var request = $scope.request.message;
            var supportID = Math.floor(Math.random() * (9999999999 - 1000000000 + 1) + 1000000000);

                //check whether huggID already exists in db
                while ($firebase(ref.child("admin").child("support").orderByKey().equalTo(supportID.toString())).$asArray().$getRecord(supportID) != null) {
                    supportID = Math.floor(Math.random() * (9999999999 - 1000000000 + 1) + 1000000000);
                } //end while

                $firebase(ref.child("admin").child("support").child(supportID)).$set({
                    displayName: $scope.currentUser.displayName,
                    firstName: $scope.currentUser.firstName,
                    email: $scope.currentUser.email,
                    time: Firebase.ServerValue.TIMESTAMP,
                    request: request,
                    done: 0,
                    supportID: supportID,
                    profileID: $scope.currentUser.profileID,
                    subject: $scope.request.subject
                }).then(function(y) {
                    $scope.popover.hide();
                    $scope.request = {
                        message: "",
                        subject: ""
                    };

                    toast.pop("Successfully sent request");
                });

        } else {
            toast.pop("Please enter a longer message");
        }
    };

    $ionicPopover.fromTemplateUrl('templates/popovers/requestSupport.html', {
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


})
.controller('homeCtrl', function($scope, $cordovaGeolocation, $ionicPopover, $state, localstorage, $firebase, toast, notifications, $q) {

    $scope.currentUser = localstorage.getObject('userData');

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
        range: "50"
    }

    //function that is executed on "Search"-Click in Popover
    $scope.displayResults = function() {

        var male = $scope.huggRequest.male;
        var female = $scope.huggRequest.female;
        var range = $scope.huggRequest.range;
        //reset huggRequest Object values
        $scope.huggRequest.male = "none";
        $scope.huggRequest.female = "none";
        $scope.huggRequest.range = "50";

        //remove popover when showing results
        $scope.popover.hide();

        //this opens the results view with the parameters
        $state.go('app.results', {
            male: male,
            female: female,
            range: range,
            clat: $scope.positions.lat,
            clng: $scope.positions.lng
        }); // end go
    }; //end function

    notifications.sync($scope.currentUser.profileID);

    var huggArray = {
        hugg: []
    }

    var ref = new Firebase("https://huggr.firebaseio.com/");
    $scope.orderHuggRef = $firebase(ref.child("hugg").orderByChild('answered').equalTo(0).limitToFirst(100)).$asArray();

    var ownHuggObject = $firebase(ref.child("hugg").orderByChild('reqProfileID').equalTo($scope.currentUser.profileID)).$asObject();
    ownHuggObject.$bindTo($scope, "ownHuggData").then(function() {}); // end bindTo

    var otherHuggObject = $firebase(ref.child("hugg").orderByChild('answerProfileID').equalTo($scope.currentUser.profileID)).$asObject();
    otherHuggObject.$bindTo($scope, "otherHuggData").then(function() {}); // end bindTo

    //wait for ref to load before continuing
    function getHuggs() {
        var deferred = $q.defer();

        $scope.orderHuggRef.$loaded().then(function(data) {
            var i = 0;
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
                    if (record.reqProfileID != $scope.currentUser.profileID) {

                        //check whether user is blocked in results                            
                        if ((record.blocked.hasOwnProperty($scope.currentUser.profileID) == false) && ($scope.currentUser.blocked.hasOwnProperty(record.reqProfileID) == false)) {

                            //calc distance
                            var radius = 6371;
                            var diffLat = ($scope.positions.lat - record.reqLat) * (Math.PI / 180);
                            var diffLon = ($scope.positions.lng - record.reqLong) * (Math.PI / 180);
                            var a =
                                Math.sin(diffLat / 2) * Math.sin(diffLat / 2) +
                                Math.cos((record.reqLat) * (Math.PI / 180)) * Math.cos(($scope.positions.lat) * (Math.PI / 180)) *
                                Math.sin(diffLon / 2) * Math.sin(diffLon / 2);
                            var b = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                            var distance = radius * b;

                            //check for distance within range and save to JSON
                            if (distance <= 10) {
                                huggArray.hugg.push({
                                    "lat": record.reqLat,
                                    "long": record.reqLong
                                }); //end push
                            } // end if

                        } //end if
                    } // end if
                }); //end then
                i++;
            } //end while
            deferred.resolve(huggArray);

            //This is the return value
        }); //end load huggRef
        return deferred.promise;
    } //end function

    getHuggs().then(function(array) {
        //this is the array to display the coordinates
        console.log(array);
        $scope.resultList = array;
    });

})
.controller('inviteCtrl', function($scope, $cordovaContacts, $cordovaSocialSharing, toast) {
    $scope.getContactList = function() {
        $cordovaContacts.find({
            filter: '',
            multiple: true
        }).then(function(result) {
            $scope.contacts = result;
        }, function(error) {
            console.log("ERROR: " + error);
        });
    };

    var message = "Hey! I am in dire need of a hug! I am using this cool new app huggr and it would be great to have you here to hug me :)";
    var subject = "Hug me on huggr!";
    var file = "file";
    var link = "https://github.com/a3rosol/huggr";
    var image = "https://github.com/a3rosol/huggr/blob/master/huggr/www/img/icon.png"

    $scope.share = function() {
        $cordovaSocialSharing.share(message, subject, file, link) // Share via native share sheet
            .then(function(result) {
                toast.pop("Thanks for spreading the word!");
            }, function(err) {
                console.log(err);
            });

    }

    $scope.tweet = function() {
        $cordovaSocialSharing
            .shareViaTwitter(message, image, link)
            .then(function(result) {
                toast.pop("Thanks for spreading the word!");
            }, function(err) {
                console.log(err);
            });
    }
    $scope.wapp = function() {
        $cordovaSocialSharing
            .shareViaWhatsApp(message, image, link)
            .then(function(result) {
                toast.pop("Thanks for spreading the word!");
            }, function(err) {
                console.log(err);
            });
    }
    $scope.fb = function() {
      $cordovaSocialSharing
           .shareViaFacebook(message, image, link)
           .then(function(result) {
                toast.pop("Thanks for spreading the word!");
           }, function(err) {
             console.log(err);
           });

    }
    $scope.sms = function() {
  // access multiple numbers in a string like: '0612345678,0687654321'
         $cordovaSocialSharing
           .shareViaSMS(message)
           .then(function(result) {
                toast.pop("Thanks for spreading the word!");
           }, function(err) {
             console.log(err);
           });
    }
    $scope.mail = function() {
         // TO, CC, BCC must be an array, Files can be either null, string or array
         $cordovaSocialSharing
           .shareViaEmail(message, subject)
           .then(function(result) {
                toast.pop("Thanks for spreading the word!");
           }, function(err) {
             console.log(err);
           });
    }


})

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
                function loadGoogleRefCheck() {
                    var def = $q.defer();
                    $scope.googleRef.$loaded().then(function(data) {
                        def.resolve(data.$getRecord(userSigninIdentifier));
                    })
                    return def.promise;
                }; //end function

                loadGoogleRefCheck().then(function(data) {
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
                        function loadDataCheckA() {
                            var def = $q.defer();
                            $scope.dataRef.$loaded().then(function(data) {
                                def.resolve(data.$getRecord($scope.profileID));
                            });
                            return def.promise;
                        } //end function load

                        //load user info
                        loadDataCheckA().then(function(profileData) {
                            localstorage.setObject("userData", profileData);
                            $state.go('app.home')
                        }); //end load()
                    } //end if
                }); //end load()     
            }
            if (authData.provider ==="facebook") {
                var userSigninIdentifier = authData.facebook.id;
                //create child for google
                $scope.facebookRef = $firebase(ref.child("users").child("signin").child("facebook").orderByKey().equalTo(userSigninIdentifier.toString())).$asArray();

                //function to handle asynchronous call to DB
                function loadFacebookRefCheck() {
                    var def = $q.defer();
                    $scope.facebookRef.$loaded().then(function(data) {
                        def.resolve(data.$getRecord(userSigninIdentifier));
                    });
                    return def.promise;
                }; //end function

                loadFacebookRefCheck().then(function(data) {
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
                        function loadDataCheckB() {
                            var def = $q.defer();
                            $scope.dataRef.$loaded().then(function(data) {
                                def.resolve(data.$getRecord($scope.profileID));
                            })
                            return def.promise;
                        } //end function load

                        //loas user info
                        loadDataCheckB().then(function(profileData) {
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
.controller('menuCtrl', function($scope, $cordovaGeolocation, $ionicPopover, $state, localstorage, $firebase, toast, notifications, $stateParams) {
    
    $scope.currentUser = localstorage.getObject('userData');
    
    $scope.deleteAllNotifications = function()
    {
        notifications.deleteAllNotifications($scope.currentUser);
    }
    
    $scope.removeNotification = function(huggID)
    {
        notifications.removeNotification($scope.currentUser, huggID);
    }

})
.controller('resultCtrl', function($scope, Auth, $firebase, $stateParams, localstorage, $cordovaGeolocation, $q, $ionicLoading, $http, $state, toast, huggActions, $ionicModal) {

        //initialize all the stuff
        $scope.auth = Auth;
        $scope.user = $scope.auth.$getAuth();
        var ref = new Firebase("https://huggr.firebaseio.com/");
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

    //
        $ionicModal.fromTemplateUrl('templates/modals/googleMaps.html', {
            scope: $scope
        }).then(function(modal) {
            $scope.gmapsModal = modal;
        });

        $scope.modalData = {};
        $scope.$on('mapInitialized', function(event, map) {
            $scope.map = map;
        });

        range = $stateParams.range;

        $scope.showPosition = function(lat, long) {
            $scope.zoom = []; //array which holds the positions we will use to pan and zoom our map to
            $scope.modalData.lat = lat;
            $scope.modalData.long = long;
            $scope.zoom.push(new google.maps.LatLng(lat, long)); //push the partners coordinates to the array
            $scope.gmapsModal.show();
            $cordovaGeolocation.getCurrentPosition().then(function(position) { //get the users current pos
                //wandle in google Maps format um
                var pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude); //important for gmaps
                $scope.zoom.push(pos); //push users coords to array
                var latlngbounds = new google.maps.LatLngBounds(); //let the google api decide the optimal pan&zoom level
                for (var i = 0; i < $scope.zoom.length; i++) {
                    latlngbounds.extend($scope.zoom[i]);
                }
                var center = latlngbounds.getCenter()
                $scope.modalData.centerLat = center.k;
                $scope.modalData.centerLng = center.D;
                $scope.map.fitBounds(latlngbounds); //show correctly fitted map
                $scope.modalData.userlat = pos.k;
                $scope.modalData.userlong = pos.D;
            }, function(err) {
                toast.pop("There was an error while we tried to locate you.");
            });

        };

        $scope.answerHugg = function(huggID, profileID) {
            huggActions.answerHugg(huggID, $scope.currentUser, profileID);
        }

        //start values
        var currentLat = $stateParams.clat;
        var currentLong = $stateParams.clng;

        $scope.requestHugg = function() {
            huggActions.requestHugg($scope.currentUser, gender, currentLat, currentLong);
        }

        //initialize JSON
        var huggArray = {
            hugg: []
        }



        //wait for ref to load before continuing
        function getHuggs() {
                var deferred = $q.defer();

                $scope.orderHuggRef.$loaded().then(function(data) {
                    var i = 0;
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

                                //check whether user is blocked in results                            
                                if ((record.blocked.hasOwnProperty($scope.currentUser.profileID) == false) && ($scope.currentUser.blocked.hasOwnProperty(record.reqProfileID) == false)) {

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
                            } // end if
                        }); //end then
                        i++;
                    } //end while
                    deferred.resolve(huggArray);

                    //This is the return value
                }); //end load huggRef
                return deferred.promise;
            } //end function

        getHuggs().then(function(array) {
            $scope.resultList = array;
        });

    }) //end resultCTRL

.directive('starRating',
    function() {
        return {
            restrict: 'A',
            template: '<ul class="rating"><li ng-repeat="star in stars" ng-class="star" ng-click="toggle($index)"><i class="icon ion-star"></i></li></ul>',
            scope: {
                ratingValue: '=',
                max: '=',
                onRatingSelected: '&'
            },
            link: function(scope, elem, attrs) {
                var updateStars = function() {
                    scope.stars = [];
                    for (var i = 0; i < scope.max; i++) {
                        scope.stars.push({
                            filled: i < scope.ratingValue
                        });
                    }
                };

                scope.toggle = function(index) {
                    scope.ratingValue = index + 1;
                    scope.onRatingSelected({
                        rating: index + 1
                    });
                };

                scope.$watch('ratingValue',
                    function(oldVal, newVal) {
                        if (newVal) {
                            updateStars();
                        }
                    }
                );
            }
        };
    }
)

.controller('supportitemCtrl', function($scope, $cordovaGeolocation, $ionicPopover, $state, localstorage, $firebase, toast, notifications, $stateParams) {
    $scope.currentUser = localstorage.getObject('userData');
    var ref = new Firebase("https://huggr.firebaseio.com/");
    
    console.log($stateParams.supportID);

    var supportObject = $firebase(ref.child("admin").child("support").child($stateParams.supportID)).$asObject();
    supportObject.$bindTo($scope, "supportData").then(function() {

    }); // end bindTo
})
;