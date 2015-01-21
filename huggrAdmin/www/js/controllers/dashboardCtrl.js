.controller('dashboardCtrl', function($scope, $cordovaGeolocation, $ionicPopover, $state, localstorage, $firebase, toast, notifications) {
    var ref = new Firebase("https://huggr.firebaseio.com/");

    $scope.request = {
        message: "",
        subject: ""
    };

    var supportObject = $firebase(ref.child("admin").child("support").orderByChild('time').limitToFirst(4)).$asObject();
    supportObject.$bindTo($scope, "supportData").then(function() {

    }); // end bindTo
    
    $scope.statistics = {
        huggNumber: null,
        userNumber: null
    }
    
    var huggObject = $firebase(ref.child("hugg")).$asObject();
    huggObject.$loaded().then(function(obj){
        $scope.statistics.huggNumber = Object.keys(obj).length;
    });
    
    var userObject = $firebase(ref.child("users").child("data")).$asObject();
    userObject.$loaded().then(function(obj){
        $scope.statistics.userNumber = Object.keys(obj).length;
    })
})