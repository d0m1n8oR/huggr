.factory('UserInfo', ["$firebase", "$q",
    function($firebase, $q) {

        return {
            getProfile: function(ID) {
                var ref = new Firebase("https://huggr.firebaseio.com/users/data");
                dataRef = $firebase(ref.orderByKey().equalTo(ID)).$asArray();
                return dataRef.$loaded().then(function(data) {
                    return angular.extend({}, data.$getRecord(ID)); //much shorter than transcribing properties manually
                }).catch(function(error) {
                    console.error("Error getting UserInfo: ", error.message);
                    return error;
                });
            }
        };
    }
])