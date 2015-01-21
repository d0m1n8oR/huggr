.factory('huggActions', ["$firebase", "toast", "$state", "$cordovaGeolocation", "$http",

    function($firebase, toast, $state, $cordovaGeolocation, $http) {
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
                    answerFirstName: currentUser.firstname,
                    answerRating: currentUser.rating

                }).then(function(data) {

                    //add notification for user that requested the hugg
                    $firebase(ref.child("users").child("data").child(profileID).child("notifications").child(huggID)).$set({
                        huggID: huggID,
                        firstName: currentUser.firstname,
                        picture: currentUser.picture,
                        time: Firebase.ServerValue.TIMESTAMP,
                        profileID: currentUser.profileID,
                        type: "answer",
                        change: "add"
                    }).then(function(x) {
                        toast.pop("Hugg answered");
                        $state.go("app.home");
                        return 1;
                    });

                }); //end then

            }, //end function
            //function to request a hugg in case the presented huggs are not suitable
            requestHugg: function(currentUser, gender) {
                //create random huggID
                var huggID = Math.floor(Math.random() * (9999999999 - 1000000000 + 1) + 1000000000);

                huggRef.$loaded().then(function(data) {

                    //check whether huggID already exists in db
                    while (data.$getRecord(huggID) != null) {
                        huggID = Math.floor(Math.random() * (9999999999 - 1000000000 + 1) + 1000000000);
                    } //end while

                    //get GPS coordinates
                    $cordovaGeolocation
                        .getCurrentPosition()
                        .then(function(position) {

                            var reverseGeocode = $http.get("https://maps.googleapis.com/maps/api/geocode/json?latlng=" + position.coords.latitude + "," + position.coords.longitude);
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
                                    reqProfileID: currentUser.profileID,
                                    reqGender: currentUser.gender,
                                    reqTime: Firebase.ServerValue.TIMESTAMP,
                                    reqFirstName: currentUser.firstname,
                                    reqPicture: currentUser.picture,
                                    reqRating: currentUser.rating,
                                    blocked: currentUser.blocked,
                                    reqLocation: reqLocation
                                }).then(function(x) {

                                    toast.pop("Hugg requested")
                                    $state.go("app.home");
                                    return 1;
                                }); //end then (rating)
                            }); //end reverseGeocode
                        }); // end then (GPS)

                }); // end then (Loaded)

            }, // end function   

            //remove huggs that nobody has answered yet from unanswered huggs list
            removeHugg: function(huggID) {
                $firebase(ref.child("hugg")).$remove(huggID).then(function(data) {
                    toast.pop("Hugg removed");
                    return 1;
                }); //end then
            }, //end function

            //accept a hugg answer to a request by this user
            acceptHugg: function(currentUser, huggID, answerProfileID) {
                $firebase(ref.child("hugg").child(huggID)).$update({
                    accepted: 1,
                    acceptTime: Firebase.ServerValue.TIMESTAMP
                }).then(function(data) {
                    var date = new Date();
                    var today = date.getTime();

                    //add notification for user that requested the hugg
                    $firebase(ref.child("users").child("data").child(answerProfileID).child("notifications").child(huggID)).$set({
                        huggID: huggID,
                        firstName: currentUser.firstname,
                        picture: currentUser.picture,
                        time: Firebase.ServerValue.TIMESTAMP,
                        profileID: currentUser.profileID,
                        type: "accept",
                        change: "add"
                    }).then(function(x) {
                        toast.pop("Hugg accepted");
                        return 1;
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
                            firstName: currentUser.firstname,
                            picture: currentUser.picture,
                            time: Firebase.ServerValue.TIMESTAMP,
                            profileID: currentUser.profileID,
                            type: "accept",
                            change: "remove"
                        }).then(function(x) {
                            toast.pop("Hugg declined");
                            return 1;
                        })
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
                        firstName: currentUser.firstname,
                        picture: currentUser.picture,
                        time: Firebase.ServerValue.TIMESTAMP,
                        profileID: currentUser.profileID,
                        type: "answer",
                        change: "remove"
                    }).then(function(x) {
                        toast.pop("Revoked answer");
                        return 1;
                    });
                }); //end then
            }, //end function


            //after the hugg has been aswered and th answer has been accepted the hugg takes place
            //after that the hugg is marked as done
            //after this the hugg can be rated
            markDone: function(currentUser, huggID) {

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
                    var userRef = $firebase(ref.child("users").child("data")).$asArray();
                    userRef.$loaded().then(function(userData) {

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
                                    firstName: currentUser.firstname,
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
                    }); //end then (load userRef)
                });
            }, //end function

            //the user that requested the hugg can rate the user that answered
            rateAnswerHugg: function(huggID, rating, answerProfileID) {
                //get rating of other user
                //if the rating is "." the other user has not yet set the rating, if it's a number the user has set a rating
                //in this case the total rating is calulated and added to the db
                huggRef.$loaded().then(function(huggData) {
                    var reqRating = huggData.$getRecord(huggID).reqRating;
                    if (reqRating != ".") {
                        var total = (reqRating + rating) / 2;
                        $firebase(ref.child("hugg").child(huggID)).$update({
                            totalRating: total
                        }); //end updae
                    }
                    //add the rating of the user to the db
                    $firebase(ref.child("hugg").child(huggID)).$update({
                        answerRating: rating
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
                                return 1;
                            }); //end update

                        }); //end then

                    }); //end update
                });

            }, //end function

            //the user that answered the hugg can rate the user that requested the hugg
            rateReqHugg: function(huggID, rating, reqProfileID) {

                huggRef.$loaded().then(function(huggData) {

                    //get rating of other user
                    //if the rating is "." the other user has not yet set the rating, if it's a number the user has set a rating
                    //in this case the total rating is calulated and added to the db
                    var answerRating = huggData.$getRecord(huggID).answerRating;
                    if (answerRating != ".") {
                        var total = (answerRating + rating) / 2;
                        $firebase(ref.child("hugg").child(huggID)).$update({
                            totalRating: total
                        }); //end updae
                    }

                    //add the rating of the user to the db
                    $firebase(ref.child("hugg").child(huggID)).$update({
                        reqRating: rating
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
                                toast.pop("Hugg rated");
                                return 1;
                            }); //end update

                        }); //end then

                    }); //end update
                }); //end loaded()

            } //end function

        };
    }
])