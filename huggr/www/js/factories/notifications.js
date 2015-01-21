.filter('keylength', function() {
  var ignoreExp = /^\$+/;
  return function(input) {
    if (!angular.isObject(input)) {
      throw Error("input was not an object!")
    }

    return Object.keys(input).filter(function(key) {

      return !ignoreExp.test(key); 
    }).length;
  }
})
    .service('notifications', ["$rootScope", "$firebase", "$timeout", "toast",

        function($rootScope, $firebase, $timeout, toast) {

            
            return {
                sync: function(ID) {
                    var ref = new Firebase("https://huggr.firebaseio.com/users/data/" + ID + "/notifications");
                    var obj = $firebase(ref).$asObject();
                    obj.$bindTo($rootScope, "notificationData").then(function() {
                        console.log(obj)
                        obj.$watch(function() {
                            toast.pop("new notification!");
                        });
                    });
                },

               deleteAllNotifications: function(currentUser) {
                    var ref = new Firebase("https://huggr.firebaseio.com/");
                    $firebase(ref.child("users").child("data").child(currentUser.profileID).child("notifications")).$remove();
                },
                
                removeNotification: function(currentUser, id) {
                    console.log(currentUser.profileID+" "+id);
                    var ref = new Firebase("https://huggr.firebaseio.com/");
                    $firebase(ref.child("users").child("data").child(currentUser.profileID).child("notifications").child(id)).$remove();
                }
            };
        }
    ])