.service('notifications', [$rootScope, $firebase,

    function($rootScope, $firebase) {

        return {
            sync: function(ID) {
                console.log(ID);
                var obj = $firebase(new Firebase("https://huggr.firebaseio.com/users/data/" + ID + "/notifications")).$asObject();
                obj.$loaded()
                    .then(function(data) {
                        obj.$bindTo($rootScope, "data");
                    });
            }
        };
    }
])
