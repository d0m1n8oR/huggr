.factory('huggActions', ["$firebase", "toast",

    function($firebase, toast) {
        return {
            answerHugg: function(huggID,currentUser, profileID) {
                var ref = new Firebase("https://huggr.firebaseio.com/");
                var date = new Date();
                var today = date.getTime();

                //adds info of user that accepts hugg to database
                $firebase(ref.child("hugg").child(huggID)).$update({
                    answered: 1,
                    answerProfileID: currentUser.profileID,
                    answerTime: today,
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
                        time: today,
                        profileID: currentUser.profileID,
                        type: "answer",
                        change: "add"
                    }).then(function(x) {
                        toast.pop("Successfully answered hugg")
                        return 1;
                    });

                }); //end then

            } //end function
        };
    }
])