.controller('homeCtrl', function($scope, $cordovaGeolocation, $ionicPopover, $state, localstorage, $firebase, toast, notifications) {
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
        range: "10 km"
    }

    //function that is executed on "Search"-Click in Popover
    $scope.displayResults = function() {

        var male = $scope.huggRequest.male;
        var female = $scope.huggRequest.female;
        var range = $scope.huggRequest.range;
        //reset huggRequest Object values
        $scope.huggRequest.male = "none";
        $scope.huggRequest.female = "none";
        $scope.huggRequest.range = "none";

        //remove popover when showing results
        $scope.popover.hide();

        //this opens the results view with the parameters
        $state.go('app.results', {
            male: male,
            female: female,
            range: range
        }); // end go
    }; //end function

    var ref = new Firebase("https://huggr.firebaseio.com/");
    $scope.currentUser = localstorage.getObject('userData');

    //watches for changes in data - maybe use bindTo?
    var obj = $firebase(ref.child("users").child("data").child($scope.currentUser.profileID).child("notifications")).$asObject();
    var unwatch = obj.$watch(function() {
        console.log("data changed!");
    });


    if ($scope.currentUser.notifications != null) {
        console.log("number of notifications: " + Object.keys($scope.currentUser.notifications).length);
        var p = $scope.currentUser.notifications
        for (var key in p) {
            if (p.hasOwnProperty(key)) {
                console.log("Benachrichtigung: " + p[key].firstName + " HuggID " + p[key].huggID + " Type: " + p[key].type + ", " + p[key].change);
                toast.pop("Benachrichtigung: " + p[key].firstName + " HuggID " + p[key].huggID + " Type: " + p[key].type + ", " + p[key].change);
            }
        }
        //console.log($scope.currentUser.notifications);
    }


})