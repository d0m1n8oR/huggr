.controller('aboutCtrl', function($scope, $cordovaGeolocation, $ionicPopover, $state, localstorage, $firebase, toast, notifications) {
    $scope.currentUser = localstorage.getObject('userData');
    var ref = new Firebase("https://huggr.firebaseio.com/");
    $scope.supportRef = $firebase(ref.child("admin").child("support")).$asArray();
    $scope.orderSupportRef = $firebase(ref.child("admin").child("support").orderByChild('profileID').equalTo($scope.currentUser.profileID)).$asArray();

    $scope.request = {
        message: null
    }

    $scope.support = {
        requests: [],
        answers: []
    }

    $scope.orderSupportRef.$loaded().then(function(data) {

        var i = 0;
        //loop to get all the elements
        while (data.$keyAt(i) != null) {
            var record = data.$getRecord(data.$keyAt(i));
            if (record.done == 0) {
                $scope.support.requests.push({
                    "displayName": record.displayName,
                    "firstName": record.firstName,
                    "email": record.email,
                    "time": record.time,
                    "reqest": record.request,
                    "done": record.done,
                    "supportID": record.supportID,
                    "profileID": record.profileID,                    
                });
            }
            else{
                $scope.support.answers.push({
                    displayName: record.displayName,
                    firstName: record.firstname,
                    email: record.email,
                    time: record.tome,
                    reqest: record.request,
                    done: record.done,
                    supportID: record.supportID,
                    profileID: record.profileID, 
                    answer: record.answer
                });
            }
            i++;
        }
    })

    $scope.sendRequest = function sendRequest() {
        //console.log($scope.request.message);
        if ($scope.request.message.length > 40) {
            console.log($scope.request.message);
            var request = $scope.request.message;
            var supportID = Math.floor(Math.random() * (9999999999 - 1000000000 + 1) + 1000000000);

            $scope.supportRef.$loaded().then(function(data) {

                //check whether huggID already exists in db
                while (data.$getRecord(supportID) != null) {
                    supportID = Math.floor(Math.random() * (9999999999 - 1000000000 + 1) + 1000000000);
                } //end while

                //time calulation
                var date = new Date();
                var today = date.getTime();

                $firebase(ref.child("admin").child("support").child(supportID)).$set({
                    displayName: $scope.currentUser.displayName,
                    firstName: $scope.currentUser.firstname,
                    email: $scope.currentUser.email,
                    time: today,
                    request: request,
                    done: 0,
                    supportID: supportID,
                    profileID: $scope.currentUser.profileID
                }).then(function(y) {
                    toast.pop("Successfully sent request");
                });
            });

        } else {
            toast.pop("Please enter a longer message");
        }
    }


})