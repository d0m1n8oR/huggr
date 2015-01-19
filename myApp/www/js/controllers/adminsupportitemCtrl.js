.controller('adminsupportitemCtrl', function($scope, $state, localstorage, $firebase, toast, notifications, $stateParams, UserInfo, $q) {
    $scope.currentUser = localstorage.getObject('userData');
    var ref = new Firebase("https://huggr.firebaseio.com/");
    $scope.supportRef = $firebase(ref.child("admin").child("support")).$asArray();
    $scope.data;
    //console.log($stateParams.supportID);

    var supportObject = $firebase(ref.child("admin").child("support").child($stateParams.supportID)).$asObject();
    supportObject.$bindTo($scope, "supportData").then(function() {
        console.log($scope.supportData.profileID);
        var deferred = $q.defer();
        $scope.user = UserInfo.getProfile($scope.supportData.profileID, deferred).then(function(value) {
            $scope.data = value;
        });
        //console.log($scope.user.value.);
    }); // end bindTo




})