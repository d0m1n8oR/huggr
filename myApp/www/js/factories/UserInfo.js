//Factory um UserInfos abzurufen
//Usage: UserInfo in den Controller injecten, dann im Code: UserInfo.getProfile(ProfileID);
//Important: This is a synchronised method, so you have to use UserInfo.getProfile({profileID}).then(function(returnData){...})
.factory('UserInfo', ["$firebase", "$q",
    function($firebase, $q) {
        //initialize firebase
        var ref = new Firebase("https://huggr.firebaseio.com/users/data");
        var dataRef = $firebase(ref).$asArray();

        //$q for synchronous method call
        var deferred = $q.defer();

        return {
            getProfile: function(ID) {
                console.log(ID);
                dataRef.$loaded()
                    .then(function(data) {
                        var record = data.$getRecord(ID);
                        var profileData = {
                            "profileID": record.profileID,
                            "displayName": record.displayName,
                            "email": record.email,
                            "picture": record.picture,
                            "birthdate": record.birthdate,
                            "age": record.age,
                            "hobby": record.hobby,
                            "gender": record.gender,
                            "firstname": record.firstname,
                            "lastname": record.lastname,
                            "numberHuggs": record.numberHuggs,
                            "rating": record.rating
                        };
                        //console.log(profileData);
                        deferred.resolve(profileData);
                        //return profileData;

                    }) // end then

                .catch(function(error) {
                    console.error("Error getting UserInfo:", error);
                    deferred.reject("Error getting UserInfo: " + error)
                }); // end catch

                return deferred.promise;
            } // end function(ID)
        };
    } // end function
]) //end factory
