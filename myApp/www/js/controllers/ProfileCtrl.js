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