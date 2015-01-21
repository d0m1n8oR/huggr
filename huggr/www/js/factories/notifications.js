.service('notifications', ["$rootScope", "$firebase", "$timeout", "toast",

    function($rootScope, $firebase, $timeout, toast) {


        return {
            sync: function(ID) {
                var ref = new Firebase("https://huggr.firebaseio.com/users/data/" + ID + "/notifications");
                var arr = $firebase(ref).$asArray();
                arr.$loaded().then(function(notifications) {
                        $rootScope.notificationData = notifications;
                        arr.$watch(function(event) {
                            switch (event.event) {
                                case "child_removed":
                                    toast.pop("Notification deleted!");
                                    break;
                                case "child_added":
                                    toast.pop("New notification!");
                                    break;
                                case "child_changed":
                                    toast.pop("Notification has been updated!");
                                    break;
                            }

                        });
                    })
                    .catch(function(error) {
                        console.log("Error:", error);
                    });
            },

            deleteAllNotifications: function(currentUser) {
                var ref = new Firebase("https://huggr.firebaseio.com/");
                $firebase(ref.child("users").child("data").child(currentUser.profileID).child("notifications")).$remove();
            },

            removeNotification: function(currentUser, id) {
                var ref = new Firebase("https://huggr.firebaseio.com/");
                $firebase(ref.child("users").child("data").child(currentUser.profileID).child("notifications").child(id)).$remove();
            }
        };
    }
])
