.controller('ChatOverviewCtrl', function($scope, $firebase, localstorage, UserInfo, $q, $filter) {

    $scope.currentUser = localstorage.getObject('userData');
    var sync = $firebase(new Firebase("https://huggr.firebaseio.com/users/data/" + $scope.currentUser.profileID + "/chat/"));
    $scope.chatList = sync.$asArray();

    $scope.chatResults = [];
    $scope.bla = [];

    $scope.chatList.$loaded().then(function() {
        for (var i = 0; i < ($scope.chatList).length; i++) {
            $scope.bla.push($scope.chatList[i].chatID)
        };


        for (var i = 0; i < ($scope.chatList).length; i++) {

            var deferred = $q.defer();
            UserInfo.getProfile($scope.chatList[i].otherProfileID, deferred).then(function(value) {
                var p = value.chat;
                var s = $scope.bla;

                for (var key in p) {
                    if (p.hasOwnProperty(key)) {
                        for (var i = 0; i < s.length; i++) {
                            if (s[i] == p[key].chatID) {
                                value.chref = s[i];
                                $scope.chatResults.push(value);
                            };

                        };

                    }
                };
            });
        };

    });



})
