.controller('aboutCtrl', function($scope, $cordovaGeolocation, $ionicPopover, $state, localstorage, $firebase, toast, notifications) {
    $scope.currentUser = localstorage.getObject('userData');
    var ref = new Firebase("https://huggr.firebaseio.com/");
    $scope.supportRef = $firebase(ref.child("admin").child("support")).$asArray();

    $scope.request = {
        message: null
    }

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
                    firsName: $scope.currentUser.firstname,
                    email: $scope.currentUser.email,
                    time: today,
                    reqest: request,
                    done: 0
                }).then(function(y) {
                    toast.pop("Successfully sent request");
                });
            });

        } else {
            toast.pop("Please enter a longer message");
        }
    }


})