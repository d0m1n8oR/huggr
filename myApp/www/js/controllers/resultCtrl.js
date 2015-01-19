.controller('resultCtrl', function($scope, Auth, $firebase, $stateParams, localstorage, $cordovaGeolocation, $q, $ionicLoading, $http, $state, toast) {

    //initialize all the stuff
    $scope.auth = Auth;
    $scope.user = $scope.auth.$getAuth();
    var ref = new Firebase("https://huggr.firebaseio.com/");
    var sync = $firebase(ref).$asObject();
    $scope.huggRef = $firebase(ref.child("hugg")).$asArray();
    $scope.currentUser = localstorage.getObject('userData');
    //displays all huggs that suit the request
    //if huggs are not answered, they are also not done or accepted
    $scope.orderHuggRef = $firebase(ref.child("hugg").orderByChild('answered').equalTo(0).limitToFirst(100)).$asArray();

    var gender;
    var range;

    //checks what gender is filtered on
    if ($stateParams.female == "none" && $stateParams.male == "true") {
        gender = "male";
    }
    if ($stateParams.male == "none" && $stateParams.female == "true") {
        gender = "female";
    }
    if (($stateParams.male == "none" && $stateParams.female == "none") || ($stateParams.male == "true" && $stateParams.female == "true")) {
        gender = "both";
    }

    //chek for range values
    if ($stateParams.range == "5 km") {
        range = 5;
    }
    if ($stateParams.range == "10 km") {
        range = 10;
    }
    if ($stateParams.range == "Forever alone 100 km") {
        range = 100;
    }

    //function to request a hugg in case the presented huggs are not suitable
    $scope.requestHugg = function requestHugg(reqLat, reqLong) {

        //create random huggID
        var huggID = Math.floor(Math.random() * (9999999999 - 1000000000 + 1) + 1000000000);

        $scope.huggRef.$loaded().then(function(data) {

            //check whether huggID already exists in db
            while (data.$getRecord(huggID) != null) {
                huggID = Math.floor(Math.random() * (9999999999 - 1000000000 + 1) + 1000000000);
            } //end while

            //time calulation
            var date = new Date();
            var today = date.getTime();

            //get GPS coordinates
            $cordovaGeolocation
                .getCurrentPosition()
                .then(function(position) {

                    console.log(position.coords.latitude + " " + position.coords.longitude);
                    var reverseGeocode = $http.get("http://maps.googleapis.com/maps/api/geocode/json?latlng=" + position.coords.latitude + "," + position.coords.longitude);
                    reverseGeocode.then(function(result) {
                        var reqLocation = result.data.results[0].address_components[1].long_name + ", " + result.data.results[0].address_components[2].long_name;
                        console.log(reqLocation);

                        //save data to firebase in new child with calculated huggID
                        $firebase(ref.child("hugg").child(huggID)).$set({
                            huggID: huggID,
                            reqLat: position.coords.latitude,
                            reqLong: position.coords.longitude,
                            FilterGender: gender,
                            done: 0,
                            answered: 0,
                            accepted: 0,
                            reqProfileID: $scope.currentUser.profileID,
                            reqGender: $scope.currentUser.gender,
                            reqTime: today,
                            reqFirstName: $scope.currentUser.firstname,
                            reqPicture: $scope.currentUser.picture,
                            reqRating: $scope.currentUser.rating,
                            blocked: $scope.currentUser.blocked,
                            reqLocation: reqLocation

                        }).then(function(x) {

                            $firebase(ref.child("hugg").child(huggID).child("rating")).$set({
                                reqRate: ".",
                                answerRate: ".",
                                totalRating: "."
                            }).then(function(y) {
                                toast.pop("Successfully requested hugg!")
                                $state.go("app.home");
                                console.log("Successfully requested hugg " + huggID);
                                return 1;
                            }); //end then

                        }); //end then (rating)
                    }); //end reverseGeocode
                }); // end then (GPS)

        }); // end then (Loaded)

    }; // end function

    //initialize JSON
    var huggArray = {
        hugg: []
    }

    //start values
    var currentLat = 49.472726;
    var currentLong = 8.449496;

    //wait for ref to load before continuing
    function getHuggs() {
        var deferred = $q.defer();

        $scope.orderHuggRef.$loaded().then(function(data) {
            var i = 0;
            //get GPS locaion
            $cordovaGeolocation
                .getCurrentPosition()
                .then(function(position) {

                    //save coordinates to var
                    currentLat = position.coords.latitude;
                    curentLong = position.coords.longitude;

                    //parse all elements of returning array
                    while (data.$keyAt(i) != null) {

                        function load() {
                            var def = $q.defer();
                            def.resolve(data.$getRecord(data.$keyAt(i)));
                            return def.promise
                        }; //end function
                        //check whether filter gender of searching person and gender of requestor match
                        //check whether gender of searching person and filter of requestor match
                        //check whether current user's profile ID is among the blocked profile IDs
                        load().then(function(record) {
                            if (((gender == "both") || (gender != "both" && record.reqGender == gender)) && ((record.FilterGender == "both") || (record.FilterGender != "both" && record.FilterGender == $scope.currentUser.gender)) && (record.reqProfileID != $scope.currentUser.profileID)) {

                                $scope.huggRef = $firebase(ref.child("hugg").child(record.huggID).child("blocked")).$asArray();
                                $scope.huggRef.$loaded().then(function(data) {

                                    //check whether user is blocked in results                            
                                    if (data.$getRecord($scope.currentUser.profileID) == null) {

                                        //calc distance
                                        var radius = 6371;
                                        var diffLat = (currentLat - record.reqLat) * (Math.PI / 180);
                                        var diffLon = (currentLong - record.reqLong) * (Math.PI / 180);
                                        var a =
                                            Math.sin(diffLat / 2) * Math.sin(diffLat / 2) +
                                            Math.cos((record.reqLat) * (Math.PI / 180)) * Math.cos((currentLat) * (Math.PI / 180)) *
                                            Math.sin(diffLon / 2) * Math.sin(diffLon / 2);
                                        var b = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                                        var distance = radius * b;

                                        //check for distance within range and save to JSON
                                        if (distance <= range) {
                                            huggArray.hugg.push({
                                                "huggID": record.huggID,
                                                "firstName": record.reqFirstName,
                                                "gender": record.reqGender,
                                                "lat": record.reqLat,
                                                "long": record.reqLong,
                                                "reqTime": record.reqTime,
                                                "picture": record.reqPicture,
                                                "profileID": record.reqProfileID,
                                                "distance": distance,
                                                "rating": record.reqRating
                                            }); //end push
                                        } // end if

                                    } //end if
                                }); //end then
                            } // end if
                        }); //end then
                        i++;
                    } //end while
                    deferred.resolve(huggArray);
                }); //end GPS then

            //This is the return value
        }); //end load huggRef
        return deferred.promise;
    } //end function

    getHuggs().then(function(array) {
        $scope.resultList = array;
        console.log(array);
    });

}) //end resultCTRL