.controller('ProfileCtrl', function($scope, $firebase, UserInfo, localstorage, $stateParams, notifications, toast, $state, $cordovaCamera) {
    
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
                $scope.currentUser.picture = "data:image/jpeg;base64," + imageData;
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
            }
            else
            {
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

    $scope.removeHugg = function(huggID) {
        huggActions.removeHugg(huggID);
    }

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

    $scope.rateAnswerHugg = function(huggID, rating, answerProfileID) {

        huggActions.rateAnswerHugg(huggID, rating, answerProfileID);
    }

    $scope.rateReqHugg = function(huggID, rating, reqProfileID) {

        huggActions.rateReqHugg(huggID, rating, reqProfileID);
    }

}) //end ProfileCtrl