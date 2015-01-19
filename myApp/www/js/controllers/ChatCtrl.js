.controller('ChatCtrl', function($scope, $stateParams, $firebase, localstorage) {
    
    chatID = $stateParams.chatID;
    console.log(chatID);

    //Reference to Firebase
    $scope.currentUser = localstorage.getObject('userData');
    var sync = $firebase(new Firebase("https://huggr.firebaseio.com/chat/"+chatID+"/message"));
    $scope.chatList = sync.$asArray();


    $scope.messageInput = "hallo";
    $scope.chatData;

    $scope.sendMessage = function() {
        $scope.chatList.$add({
            message: $scope.messageInput,
            user: $scope.currentUser.firstname
        });
        $scope.messageInput = '';
    };

    var obj = sync.$asObject();
    obj.$loaded().then(function() {
        console.log(obj);
        obj.$bindTo($scope, "chatData");
    });
})