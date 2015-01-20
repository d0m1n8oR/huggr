.filter('keylength', function() {
        return function(input) {
            if (!angular.isObject(input)) {
                throw Error("Usage of non-objects with keylength filter!!")
            }
            return Object.keys(input).length;
        }
    })
    .service('notifications', ["$rootScope", "$firebase", "$timeout", "toast",

        function($rootScope, $firebase, $timeout, toast) {

            return {
                sync: function(ID) {
                    var ref = new Firebase("https://huggr.firebaseio.com/users/data/" + ID + "/notifications");
                    var obj = $firebase(ref).$asObject();

                    obj.$bindTo($rootScope, "notificationData").then(function() {
                        obj.$watch(function() {
                            toast.pop("new notification!");
                        });

                        for (var key in $rootScope.notificationData) {
                            /*if ($rootScope.notificationData.hasOwnProperty(key)) {
                                console.log($rootScope.notificationData[key]);
                                $timeout(function() {
                                    toast.pop($rootScope.notificationData[key].huggID);
                                }, 5500);

                            }*/
                        };
                    });
                }
            };
        }
    ])
