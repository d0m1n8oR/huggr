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
                        toast.pop("Successfully answered hugg");
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
                                    reqLocation: reqLocation,
                                    reqRate: ".",
                                    answerRate: ".",
                                    totalRating: "."

                                }).then(function(x) {

                                    toast.pop("Successfully requested hugg!")
                                    $state.go("app.home");
                                    console.log("Successfully requested hugg " + huggID);
                                    return 1;
                                }); //end then (rating)
                            }); //end reverseGeocode
                        }); // end then (GPS)

                }); // end then (Loaded)

            }, // end function   

            //remove huggs that nobody has answered yet from unanswered huggs list
            removeHugg: function(huggID) {
                $firebase(ref.child("hugg")).$remove(huggID).then(function(data) {
                    toast.pop("Successfully removed hugg");
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
                    toast.pop("successfully accepted hugg!");
                    return 1;
                })

            }) //end then

        }, //end function

        };
    }
])