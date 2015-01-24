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