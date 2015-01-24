.controller('homeCtrl', function($scope, $cordovaGeolocation, $ionicPopover, $state, localstorage, $firebase, toast, notifications, $q) {

    //Setze Koordinaten für Initialisierung von Maps
    $scope.positions = {
        lat: 49.4677562,
        lng: 8.506636
    };

    $scope.$on('mapInitialized', function(event, map) {
        $scope.map = map;
        //hole die GPS/IP-Geolocation
        $cordovaGeolocation
            .getCurrentPosition()
            .then(function(position) {
                //wandle in google Maps format um
                var pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                $scope.positions.lat = pos.k;
                $scope.positions.lng = pos.D;
            }, function(err) {
                alert("error locating the user");
            });
    });

    $ionicPopover.fromTemplateUrl('templates/popovers/hugSettings.html', {
        scope: $scope,
    }).then(function(popover) {
        $scope.popover = popover;
    });
    $scope.openPopover = function($event) {
        $scope.popover.show($event);
    };
    $scope.closePopover = function() {
        $scope.popover.hide();
    };
    //Cleanup the popover when we're done with it!
    $scope.$on('$destroy', function() {
        $scope.popover.remove();
    });
    // Execute action on hide popover
    $scope.$on('popover.hidden', function() {
        // Execute action
    });
    // Execute action on remove popover
    $scope.$on('popover.removed', function() {
        // Execute action
    });

    //create huggRequest Object to store values from filters popup
    $scope.huggRequest = {
        male: "none",
        female: "none",
        range: "50"
    }

    //function that is executed on "Search"-Click in Popover
    $scope.displayResults = function() {

        var male = $scope.huggRequest.male;
        var female = $scope.huggRequest.female;
        var range = $scope.huggRequest.range;
        //reset huggRequest Object values
        $scope.huggRequest.male = "none";
        $scope.huggRequest.female = "none";
        $scope.huggRequest.range = "50";

        //remove popover when showing results
        $scope.popover.hide();

        //this opens the results view with the parameters
        $state.go('app.results', {
            male: male,
            female: female,
            range: range,
            clat: $scope.positions.lat,
            clng: $scope.positions.lng
        }); // end go
    }; //end function

    $scope.currentUser = localstorage.getObject('userData');
    notifications.sync($scope.currentUser.profileID);
    
    var huggArray = {
            hugg: []
        }
    
        var ref = new Firebase("https://huggr.firebaseio.com/");
    $scope.orderHuggRef = $firebase(ref.child("hugg").orderByChild('answered').equalTo(0).limitToFirst(100)).$asArray();
    
    var ownHuggObject = $firebase(ref.child("hugg").orderByChild('reqProfileID').equalTo($scope.currentUser.profileID)).$asObject();
    ownHuggObject.$bindTo($scope, "ownHuggData").then(function() {}); // end bindTo

    var otherHuggObject = $firebase(ref.child("hugg").orderByChild('answerProfileID').equalTo($scope.currentUser.profileID)).$asObject();
    otherHuggObject.$bindTo($scope, "otherHuggData").then(function() {}); // end bindTo

    //wait for ref to load before continuing
    function getHuggs() {
        var deferred = $q.defer();

        $scope.orderHuggRef.$loaded().then(function(data) {
            var i = 0;
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
                    if (record.reqProfileID != $scope.currentUser.profileID) {

                        //check whether user is blocked in results                            
                        if ((record.blocked.hasOwnProperty($scope.currentUser.profileID) == false) && ($scope.currentUser.blocked.hasOwnProperty(record.reqProfileID) == false)) {

                            //calc distance
                            var radius = 6371;
                            var diffLat = ($scope.positions.lat - record.reqLat) * (Math.PI / 180);
                            var diffLon = ($scope.positions.lng - record.reqLong) * (Math.PI / 180);
                            var a =
                                Math.sin(diffLat / 2) * Math.sin(diffLat / 2) +
                                Math.cos((record.reqLat) * (Math.PI / 180)) * Math.cos(($scope.positions.lat) * (Math.PI / 180)) *
                                Math.sin(diffLon / 2) * Math.sin(diffLon / 2);
                            var b = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                            var distance = radius * b;

                            //check for distance within range and save to JSON
                            if (distance <= 10) {
                                huggArray.hugg.push({
                                    "lat": record.reqLat,
                                    "long": record.reqLong
                                }); //end push
                            } // end if

                        } //end if
                    } // end if
                }); //end then
                i++;
            } //end while
            deferred.resolve(huggArray);

            //This is the return value
        }); //end load huggRef
        return deferred.promise;
    } //end function

    getHuggs().then(function(array) {
        //this is the array to display the coordinates
        console.log(array);
        $scope.resultList = array;
    });

})