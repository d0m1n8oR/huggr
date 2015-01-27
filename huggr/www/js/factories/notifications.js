.service('notifications', ["$rootScope", "$firebase", "$timeout", "toast", "$cordovaVibration",

    function($rootScope, $firebase, $timeout, toast, $cordovaVibration) {

        var ref = new Firebase("https://huggr.firebaseio.com/")
        return {
            sync: function(ID) {
                var arr = $firebase(ref.child("users").child("data").child(ID).child("notifications")).$asArray();
                arr.$loaded().then(function(notifications) {
                    $rootScope.notificationData = notifications;
                    arr.$watch(function(event) {
                        switch (event.event) {
                            case "child_removed":
                                toast.pop("Notification deleted!");
                                  $cordovaVibration.vibrate(100);
                                break;
                            case "child_added":
                                toast.pop("New notification!");
                                  $cordovaVibration.vibrate(100);
                                break;
                            case "child_changed":
                                toast.pop("New notification!");
                                  $cordovaVibration.vibrate(100);
                                break;
                        }

                    });
                })
                    .catch(function(error) {
                        console.log("Error:", error);
                    });
            },

            deleteAllNotifications: function(currentUser) {
                $firebase(ref.child("users").child("data").child(currentUser.profileID).child("notifications")).$remove();
            },

            removeNotification: function(currentUser, id) {
                $firebase(ref.child("users").child("data").child(currentUser.profileID).child("notifications").child(id)).$remove();
            }
        };
    }
])