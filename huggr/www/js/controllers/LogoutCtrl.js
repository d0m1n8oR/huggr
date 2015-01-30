.controller('LogoutCtrl', function($scope, Auth, $state, localstorage) {
    $scope.auth = Auth;
    //function for logout
    $scope.logout = function() {

        //disconnects user from auth object, needs to relogin
        $scope.auth.$unauth();
    	localstorage.setObject('userData',null);

        //reloads window to show login fields
        $state.go('app.home');
    } // end function
})