.factory('UserInfo', ["$firebase", "$q", function($firebase, $q) {
    var ref = new Firebase("https://huggr.firebaseio.com/users/data"),
        dataRef = $firebase(ref).$asArray();
    return {
        getProfile: function(ID) {
            return dataRef.$loaded().then(function(data) {
                return angular.extend({}, data.$getRecord(ID));//much shorter than transcribing properties manually
            }).catch(function(error) {
                console.error("Error getting UserInfo: ", error.message);
                return $q.reject(error);
            });
        }
    };
}])