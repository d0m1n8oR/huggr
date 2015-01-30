.controller('menuCtrl', function($scope, $cordovaGeolocation, $ionicPopover, $state, localstorage, $firebase, toast, notifications, $stateParams) {
    
    $scope.currentUser = localstorage.getObject('userData');
    
    //function to remove notification
    $scope.removeNotification = function(huggID)
    {
        notifications.removeNotification($scope.currentUser, huggID);
    }

})