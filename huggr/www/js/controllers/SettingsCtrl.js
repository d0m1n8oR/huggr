.controller('SettingsCtrl', function($scope, localstorage, $firebase, $cordovaCamera, notifications, toast) {
    //Initial holen wir die Nutzerdaten aus dem Localstorage, damit wir mit der ProfileID arbeiten können.
    $scope.userData = localstorage.getObject('userData');
    notifications.sync($scope.userData.profileID);


    var ref = new Firebase("https://huggr.firebaseio.com/users/data/" + $scope.userData.profileID);
    var userObject = $firebase(ref).$asObject();
    //Katsching! Three-Way-Databinding 4tw! <3 AngularFire
    userObject.$bindTo($scope, "userData").then(localstorage.setObject("userData", $scope.userData));

    var connectRef = new Firebase("https://huggr.firebaseio.com/users/");
    $scope.googleRef = $firebase(connectRef.child("signin").child("google")).$asArray();
    $scope.facebookRef = $firebase(connectRef.child("signin").child("facebook")).$asArray();

    var mainref = new Firebase("https://huggr.firebaseio.com/");

    $scope.connect = function(provider) {
        if (provider == "toGoogle") {
            connectRef.authWithOAuthPopup("google", function(err, user) {
                if (err) {
                    console.log(err);
                }
                if (user) {
                    connectRef.onAuth(function(authData) {
                        $firebase(mainref.child("users").child("signin").child("google").child(authData.google.id)).$set({
                            displayName: authData.google.displayName,
                            token: authData.token,
                            expires: authData.expires,
                            uid: authData.uid,
                            ID: authData.google.id,
                            AccessToken: authData.google.accessToken,
                            profileID: $scope.userData.profileID
                        });
                        $firebase(ref).$update({
                            googleID: authData.google.id
                        });
                        toast.pop("Successfully connected");
                    });

                }
            });
        }
        if (provider == "toFacebook") {
            connectRef.authWithOAuthPopup("facebook", function(err, user) {
                if (err) {
                    console.log(err);
                }
                if (user) {
                    connectRef.onAuth(function(authData) {
                        $firebase(mainref.child("users").child("signin").child("facebook").child(authData.facebook.id)).$set({
                            displayName: authData.facebook.displayName,
                            token: authData.token,
                            expires: authData.expires,
                            uid: authData.uid,
                            ID: authData.facebook.id,
                            AccessToken: authData.facebook.accessToken,
                            profileID: $scope.userData.profileID
                        });
                        $firebase(ref).$update({
                            facebookID: authData.facebook.id
                        });
                        toast.pop("Successfully connected");
                    });
                }
            });
        }
    }

    document.addEventListener("deviceready", function() {

        var options = {
            quality: 90,
            destinationType: Camera.DestinationType.DATA_URL,
            sourceType: Camera.PictureSourceType.CAMERA,
            allowEdit: true,
            encodingType: Camera.EncodingType.JPEG,
            popoverOptions: CameraPopoverOptions,
            saveToPhotoAlbum: false
        };
        $scope.takeNewPicture = function() {
            $cordovaCamera.getPicture(options).then(function(imageData) {
                $scope.userData.picture = "data:image/jpeg;base64," + imageData;
            }, function(err) {
                // error
            });
        };


    }, false);

})