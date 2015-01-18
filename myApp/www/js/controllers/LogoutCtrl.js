.controller('LogoutCtrl', function($scope, Auth) {
    $scope.auth = Auth;
    //function for logout
    $scope.logout = function() {

        //disconnects user from auth object, needs to relogin
        $scope.auth.$unauth();

        //reloads window to show login fields
        window.location.reload();
    } // end function
})