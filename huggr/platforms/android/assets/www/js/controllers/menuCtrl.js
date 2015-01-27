.controller('menuCtrl', function($scope, $cordovaGeolocation, $ionicPopover, $state, localstorage, $firebase, toast, notifications, $stateParams) {
    
    $scope.currentUser = localstorage.getObject('userData');
    
    $scope.deleteAllNotifications = function()
    {
        notifications.deleteAllNotifications($scope.currentUser);
    }
    
    $scope.removeNotification = function(huggID)
    {
        notifications.removeNotification($scope.currentUser, huggID);
    }

})