.factory('toast', function($rootScope, $timeout, $ionicPopup, $ionicLoading, $cordovaVibration) {
    return {
        show: function(message, duration, position) {
            message = message || "There was a problem...";
            duration = duration || 'short';
            position = position || 'top';


            if (duration == 'short') {
                duration = 2000;
            } else {
                duration = 5000;
            }

            var myPopup = $ionicPopup.show({
                template: "<div class='toast'>" + message + "</div>",
                scope: $rootScope,
                buttons: []
            });
            $cordovaVibration.vibrate(100);


            $timeout(function() {
                myPopup.close();
            }, duration);

        },
        pop: function(msg) {
            var myToast = $ionicLoading.show({
                template: msg,
                noBackdrop: true,
                duration: 1000
            });
            $cordovaVibration.vibrate(100);

        }
    }
})
