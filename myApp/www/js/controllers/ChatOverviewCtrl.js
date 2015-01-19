.controller('ChatOverviewCtrl', function($scope, $firebase, localstorage, UserInfo, $q) {

    $scope.currentUser = localstorage.getObject('userData');
    var sync = $firebase(new Firebase("https://huggr.firebaseio.com/users/data/" + $scope.currentUser.profileID + "/chat/"));
    $scope.chatList = sync.$asArray();

    $scope.chatResults = [];

    $scope.chatList.$loaded().then(function() {
        for (var i = 0; i < ($scope.chatList).length; i++) {

            var deferred = $q.defer();
            var chatID = $scope.chatList[i].chatID;
            UserInfo.getProfile($scope.chatList[i].otherProfileID, deferred).then(function(value) {
                                console.log("test"+chatID);
                                $scope.chatResults.push(value);
                                

            });
        };

    });



})
