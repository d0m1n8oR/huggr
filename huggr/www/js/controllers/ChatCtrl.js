.directive('input', function($timeout) {
    return {
        restrict: 'E',
        scope: {
            'returnClose': '=',
            'onReturn': '&',
            'onFocus': '&',
            'onBlur': '&'
        },
        link: function(scope, element, attr) {
            element.bind('focus', function(e) {
                if (scope.onFocus) {
                    $timeout(function() {
                        scope.onFocus();
                    });
                }
            });
            element.bind('blur', function(e) {
                if (scope.onBlur) {
                    $timeout(function() {
                        scope.onBlur();
                    });
                }
            });
            element.bind('keydown', function(e) {
                if (e.which == 13) {
                    if (scope.returnClose) element[0].blur();
                    if (scope.onReturn) {
                        $timeout(function() {
                            scope.onReturn();
                        });
                    }
                }
            });
        }
    }
})

.controller('ChatCtrl', function($scope, $stateParams, $firebase, localstorage, toast, $ionicScrollDelegate) {

    chatID = $stateParams.chatID;
    $scope.ctitle = $stateParams.chatTitle;
    console.log("ChatID:" + chatID);

    var isIOS = ionic.Platform.isWebView() && ionic.Platform.isIOS();

    //Reference to Firebase
    $scope.currentUser = localstorage.getObject('userData');
    var sync = $firebase(new Firebase("https://huggr.firebaseio.com/chat/" + chatID + "/message"));
    $scope.chatList = sync.$asArray();

    $scope.messageInput = "";
    $scope.chatData;

    $scope.inputUp = function() {
        if (isIOS) $scope.data.keyboardHeight = 216;
        //$timeout(function() {
        //  $ionicScrollDelegate.scrollBottom(true);
        //}, 300);

    };

    $scope.inputDown = function() {
        if (isIOS) $scope.data.keyboardHeight = 0;
        $ionicScrollDelegate.resize();
    };

    $scope.closeKeyboard = function() {
        // cordova.plugins.Keyboard.close();
    };

    $scope.sendMessage = function() {
        $scope.chatList.$add({
            message: $scope.messageInput,
            user: $scope.currentUser.profileID,
            picture: $scope.currentUser.picture,
            time: Date.now(),
            name: $scope.currentUser.firstName
        }).then(function(sync) {
            var id = sync.key();
            toast.pop("Message sent!");
            $scope.messageInput = '';
            $ionicScrollDelegate.scrollBottom();

        });
    };

    var obj = sync.$asObject();
    obj.$loaded().then(function() {
        obj.$bindTo($scope, "chatData").then(function() {
            $ionicScrollDelegate.scrollBottom();

        });
    });
})
