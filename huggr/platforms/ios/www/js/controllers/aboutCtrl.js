.controller('aboutCtrl', function($scope, $cordovaGeolocation, $ionicPopover, $state, localstorage, $firebase, toast, notifications) {
    $scope.currentUser = localstorage.getObject('userData');
    var ref = new Firebase("https://huggr.firebaseio.com/");

    $scope.request = {
        message: "",
        subject: ""
    };

    var userObject = $firebase(ref.child("admin").child("support").orderByChild('profileID').equalTo($scope.currentUser.profileID)).$asObject();
    userObject.$bindTo($scope, "supportData").then(function() {

    }); // end bindTo

    $scope.sendRequest = function sendRequest() {
        //console.log($scope.request.message);
        if ($scope.request.message.length > 40 && $scope.request.subject.length > 15) {
            console.log($scope.request.message);
            var request = $scope.request.message;
            var supportID = Math.floor(Math.random() * (9999999999 - 1000000000 + 1) + 1000000000);

                //check whether huggID already exists in db
                while ($firebase(ref.child("admin").child("support").orderByKey().equalTo(supportID.toString())).$asArray().$getRecord(supportID) != null) {
                    supportID = Math.floor(Math.random() * (9999999999 - 1000000000 + 1) + 1000000000);
                } //end while

                $firebase(ref.child("admin").child("support").child(supportID)).$set({
                    displayName: $scope.currentUser.displayName,
                    firstName: $scope.currentUser.firstName,
                    email: $scope.currentUser.email,
                    time: Firebase.ServerValue.TIMESTAMP,
                    request: request,
                    done: 0,
                    supportID: supportID,
                    profileID: $scope.currentUser.profileID,
                    subject: $scope.request.subject
                }).then(function(y) {
                    $scope.popover.hide();
                    $scope.request = {
                        message: "",
                        subject: ""
                    };

                    toast.pop("Successfully sent request");
                });

        } else {
            toast.pop("Please enter a longer message");
        }
    };

    $ionicPopover.fromTemplateUrl('templates/popovers/requestSupport.html', {
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


})