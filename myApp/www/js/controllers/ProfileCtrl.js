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

    var ownHuggObject = $firebase(ref.child("hugg").orderByChild('reqProfileID').equalTo($scope.currentUser.profileID)).$asObject();
    ownHuggObject.$bindTo($scope, "ownHuggData").then(function() {}); // end bindTo

    var otherHuggObject = $firebase(ref.child("hugg").orderByChild('answerProfileID').equalTo($scope.currentUser.profileID)).$asObject();
    otherHuggObject.$bindTo($scope, "otherHuggData").then(function() {}); // end bindTo

    var blockedUserObject = $firebase(ref.child("data").child("users").child($scope.currentUser.profileID)).$asObject();
    blockedUserObject.$bindTo($scope, "blockedUserData").then(function() {

        blockedUserObject.$loaded().then(function(data) {
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

    }); // end bindTo

    //$scope.noBlockedUsers;
    //  $scope.blockedUsers = {[]}

    //show users currently blocked

    /* //doesn't work with currentUser ...
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
    });*/

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
                    type: "accept",
                    change: "remove"
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
                        var date = new Date();
                        var today = date.getTime();
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