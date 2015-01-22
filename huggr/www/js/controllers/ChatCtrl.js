.controller('ChatCtrl', function($scope, $stateParams, $firebase, localstorage, toast, $ionicScrollDelegate) {

    chatID = $stateParams.chatID;
    $scope.ctitle = $stateParams.chatTitle;
    console.log("ChatID:" +chatID);

    //Reference to Firebase
    $scope.currentUser = localstorage.getObject('userData');
    var sync = $firebase(new Firebase("https://huggr.firebaseio.com/chat/" + chatID + "/message"));
    $scope.chatList = sync.$asArray();

    $scope.messageInput = "";
    $scope.chatData;

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
        $ionicScrollDelegate.scrollBottom();
        obj.$bindTo($scope, "chatData");
    });
})
