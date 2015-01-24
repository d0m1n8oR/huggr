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
                    //load infos for selected hugg
                    var record = huggData.$getRecord(huggID);
                    var otherProfileID
                    if (record.reqProfileID == currentUser.profileID) {
                        otherProfileID = record.answerProfileID;
                    } else {
                        otherProfileID = record.reqProfileID;
                    }

                    //define ref for users
                    var userRefA = $firebase(ref.child("users").child("data").orderByKey().equalTo(record.reqProfileID.toString())).$asArray();
                    userRefA.$loaded().then(function(userDataA) {
                        //load current number of huggs for both users and add 1
                        var reqNumberHuggs = userDataA.$getRecord(record.reqProfileID).numberHuggs + 1;

                        var userRefB = $firebase(ref.child("users").child("data").orderByKey().equalTo(record.answerProfileID.toString())).$asArray();
                        userRefB.$loaded().then(function(userDataB) {
                            var answerNumberHuggs = userDataB.$getRecord(record.answerProfileID).numberHuggs + 1;

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
                                        toast.pop("Hugg done");
                                        return 1;
                                    })
                                }); //end then (finalize)
                            }); //end then (update answerer)
                        });
                    }); //end then (load userRef)
                });
            }, //end function

            //the user that requested the hugg can rate the user that answered
            rateAnswerHugg: function(huggID, rating, answerProfileID, reqHuggRating) {
                console.log(reqHuggRating);
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
                    var userRef = $firebase(ref.child("users").child("data")).$asArray();
                    userRef.$loaded().then(function(userData) {

                        var answerRating = (userData.$getRecord(answerProfileID).rating * (userData.$getRecord(answerProfileID).numberHuggs - 1) + rating) / (userData.$getRecord(answerProfileID).numberHuggs);

                        $firebase(ref.child("users").child("data").child(answerProfileID)).$update({
                            rating: answerRating
                        }).then(function(y) {
                            toast.pop("Hugg rated");
                            if (reqHuggRating != "-1") {
                                console.log(reqHuggRating + " " + rating)
                                total = (reqHuggRating + rating) / 2;
                                deferred.resolve(total);
                            } else {
                                total = -1;
                                deferred.resolve(total);
                            }

                        }); //end update

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

                console.log("Rating in method"+rating);

                //add the rating of the user to the db
                $firebase(ref.child("hugg").child(huggID)).$update({
                    huggReqRating: rating
                }).then(function(x) {

                    //calculates the rating of the other user
                    //the data of the other user is loaded and then then his avarage rating is mulitplied with the number of Huggs
                    //then the rating for this hugg is added and the result is devided by the new number of huggs
                    //the result is the new avarage rating for the user and is saved to the db
                    var userRef = $firebase(ref.child("users").child("data")).$asArray();
                    userRef.$loaded().then(function(userData) {

                        var reqRating = (userData.$getRecord(reqProfileID).rating * (userData.$getRecord(reqProfileID).numberHuggs - 1) + rating) / (userData.$getRecord(reqProfileID).numberHuggs);

                        $firebase(ref.child("users").child("data").child(reqProfileID)).$update({
                            rating: reqRating
                        }).then(function(y) {
                            if (answerHuggRating != "-1") {
                                console.log(answerHuggRating + " " + rating)
                                total = (answerHuggRating + rating) / 2;
                                deferred.resolve(total);
                            } else {
                                total = -1;
                                deferred.resolve(total);
                            }
                            toast.pop("Hugg rated");
                        }); //end update

                    }); //end then

                }); //end update
                return deferred.promise;

            } //end function

        };
    }
])