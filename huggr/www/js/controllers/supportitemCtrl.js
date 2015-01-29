.controller('supportitemCtrl', function($scope, $cordovaGeolocation, $ionicPopover, $state, localstorage, $firebase, toast, notifications, $stateParams) {
    $scope.currentUser = localstorage.getObject('userData');
    var ref = new Firebase("https://huggr.firebaseio.com/");
    
    //DATA BINDING
    var supportObject = $firebase(ref.child("admin").child("support").child($stateParams.supportID)).$asObject();
    supportObject.$bindTo($scope, "supportData").then(function() {

    }); // end bindTo
})