.controller('adminsupportitemCtrl', function($scope, $state, localstorage, $firebase, toast, notifications, $stateParams, UserInfo, $q) {
    $scope.currentUser = localstorage.getObject('userData');
    var ref = new Firebase("https://huggr.firebaseio.com/");
    $scope.supportRef = $firebase(ref.child("admin").child("support")).$asArray();
    $scope.data;
    var supportID = $stateParams.supportID;

    var supportObject = $firebase(ref.child("admin").child("support").child($stateParams.supportID)).$asObject();
    supportObject.$bindTo($scope, "supportData").then(function() {
        var deferred = $q.defer();
        $scope.user = UserInfo.getProfile($scope.supportData.profileID, deferred).then(function(value) {
            $scope.data = value;
        });
    }); // end bindTo

    $scope.message = {
        message: " "
    };
    
    $scope.answerRequest = function answerRequest() {
        if ($scope.message.message.length > 40) {
                //time calulation
                var date = new Date();
                var today = date.getTime();

                $firebase(ref.child("admin").child("support").child(supportID)).$update({
                    closeTime: today,
                    done: 1,
                    answer: $scope.message.message
                }).then(function(y) {
                    $scope.message = {
                        message: " "
                    };

                    toast.pop("Successfully answered request");
                });
        } else {
            toast.pop("Please enter a longer message");
        }
    };

})