.controller('supportitemCtrl', function($scope, $cordovaGeolocation, $ionicPopover, $state, localstorage, $firebase, toast, notifications, $stateParams) {
    $scope.currentUser = localstorage.getObject('userData');
    var ref = new Firebase("https://huggr.firebaseio.com/");
    $scope.supportRef = $firebase(ref.child("admin").child("support")).$asArray();
    $scope.orderSupportRef = $firebase(ref.child("admin").child("support").orderByChild('profileID').equalTo($scope.currentUser.profileID)).$asArray();
    
    console.log($stateParams.supportID);

    var supportObject = $firebase(ref.child("admin").child("support").child($stateParams.supportID)).$asObject();
    supportObject.$bindTo($scope, "supportData").then(function() {

    }); // end bindTo
})