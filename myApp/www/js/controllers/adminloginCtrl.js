.controller('adminloginCtrl', function($scope, $cordovaGeolocation, $ionicPopover, $state, localstorage, $firebase, toast, notifications, $firebaseAuth) {
    $scope.currentUser = localstorage.getObject('userData');
    var ref = new Firebase("https://huggr.firebaseio.com/");
    $scope.supportRef = $firebase(ref.child("admin").child("support")).$asArray();

    $scope.login = {
        username: "",
        password: ""
    };

    $scope.login = function(login) {
        if ($scope.login.username.length > 4 && $scope.login.password.length >3) {
            var ref = new Firebase("https://huggr.firebaseio.com");
            $scope.authObj = $firebaseAuth(ref);
            $scope.authObj.$authWithPassword({
                email: $scope.login.username,
                password: $scope.login.password
            }).then(function(authData) {
                console.log("Logged in as:", authData.uid);
                $state.go("app.adminsupportoverview");
            }).catch(function(error) {
                 toast.pop("Authentification failed: "+error.code);
                console.error("Authentication failed:", error);
               
            });
        }
        else{
            toast.pop("Please put in your login data!");
        }
    }
})