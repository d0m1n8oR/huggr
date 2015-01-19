.controller('adminsupportoverviewCtrl', function($scope, $cordovaGeolocation, $ionicPopover, $state, localstorage, $firebase, toast, notifications) {
    var ref = new Firebase("https://huggr.firebaseio.com/");
    $scope.supportRef = $firebase(ref.child("admin").child("support")).$asArray();

    $scope.request = {
        message: "",
        subject: ""
    };

    var userObject = $firebase(ref.child("admin").child("support")).$asObject();
    userObject.$bindTo($scope, "supportData").then(function() {

    }); // end bindTo
})