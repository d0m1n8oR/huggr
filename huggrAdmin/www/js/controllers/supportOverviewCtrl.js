.controller('supportoverviewCtrl', function($scope, $firebase) {
    var ref = new Firebase("https://huggr.firebaseio.com/");

    $scope.request = {
        message: "",
        subject: ""
    };

    var supportObject = $firebase(ref.child("admin").child("support")).$asObject();
    supportObject.$bindTo($scope, "supportData").then(function() {

    }); // end bindTo
})