.controller('ChatCtrl', function($scope, $stateParams, $firebase, localstorage) {

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
            name: $scope.currentUser.firstname
        }).then(function(sync) {
            var id = sync.key();
            console.log("added record with id " + id);
            $scope.messageInput = '';

        });
    };

    var obj = sync.$asObject();
    obj.$loaded().then(function() {
        obj.$bindTo($scope, "chatData");
    });
})
